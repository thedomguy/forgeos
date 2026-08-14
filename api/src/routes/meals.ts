import { Router } from 'express';
import { z } from 'zod';
import { one, query, tx } from '../db';
import { h, HttpError, hhmm, dayFor, writeActivity } from '../lib';

export const mealsRouter = Router();

// ── validation ─────────────────────────────────────────────────
const itemSchema = z.object({
  n: z.string().trim().min(1),
  kcal: z.number(),
  p: z.number(),
  c: z.number(),
  f: z.number(),
  emoji: z.string().optional(),
});

const createBody = z.object({
  name: z.string().trim().min(1),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'day must be YYYY-MM-DD')
    .optional(),
});

const itemsBody = z.object({
  items: z.array(itemSchema).min(1),
});

const patchBody = z.object({
  patch: z.object({
    n: z.string().trim().min(1).optional(),
    kcal: z.number().optional(),
    p: z.number().optional(),
    c: z.number().optional(),
    f: z.number().optional(),
    emoji: z.string().optional(),
  }),
});

// ── shape helpers ──────────────────────────────────────────────
type MealRow = { id: string; name: string; logged_at: Date };
type ItemRow = {
  id: string;
  name: string;
  kcal: string;
  p: string;
  c: string;
  f: string;
  emoji: string | null;
  logged_at: Date;
};

// Load a meal (owned by userId) and build the /state meals[] entry shape.
// Throws 404 if the meal does not exist or is not owned by the user.
async function loadMeal(userId: string, tz: string, mealId: string) {
  const meal = await one<MealRow>(
    'select id, name, logged_at from meals where id = $1 and user_id = $2',
    [mealId, userId],
  );
  if (!meal) throw new HttpError(404, 'Meal not found');

  const rows = await query<ItemRow>(
    `select id, name, kcal, p, c, f, emoji, logged_at
       from food_items where meal_id = $1 order by logged_at, id`,
    [mealId],
  );

  const items = rows.map((r) => ({
    n: r.name,
    kcal: Number(r.kcal),
    p: Number(r.p),
    c: Number(r.c),
    f: Number(r.f),
    emoji: r.emoji ?? undefined,
  }));
  const kcal = items.reduce((s, i) => s + i.kcal, 0);
  const time = hhmm(tz, rows.length ? rows[0].logged_at : meal.logged_at);

  return { id: meal.id, meal: meal.name, time, kcal, items };
}

// Resolve the id of the i-th item (0-based, ordered by logged_at then id).
async function itemIdAt(mealId: string, i: number): Promise<string> {
  const rows = await query<{ id: string }>(
    'select id from food_items where meal_id = $1 order by logged_at, id',
    [mealId],
  );
  const row = rows[i];
  if (!row) throw new HttpError(404, 'Item not found');
  return row.id;
}

function parseIndex(raw: string): number {
  const i = Number(raw);
  if (!Number.isInteger(i) || i < 0) throw new HttpError(400, 'Invalid item index');
  return i;
}

// Ensure the meal exists and belongs to the user; returns its row.
async function requireMeal(userId: string, mealId: string): Promise<MealRow> {
  const meal = await one<MealRow>(
    'select id, name, logged_at from meals where id = $1 and user_id = $2',
    [mealId, userId],
  );
  if (!meal) throw new HttpError(404, 'Meal not found');
  return meal;
}

// ── routes ─────────────────────────────────────────────────────

// POST /  → create a custom meal for a day (409 if the name is taken that day).
mealsRouter.post(
  '/',
  h(async (req, res) => {
    const userId = req.user!.id;
    const tz = req.user!.tz;
    const { name, day } = createBody.parse(req.body);
    const d = day || dayFor(tz);

    const existing = await one(
      'select id from meals where user_id = $1 and day = $2 and name = $3',
      [userId, d, name],
    );
    if (existing) throw new HttpError(409, 'A meal with that name already exists for this day');

    const created = await tx(async (c) => {
      const sortRes = await c.query(
        'select coalesce(max(sort), -1) + 1 as sort from meals where user_id = $1 and day = $2',
        [userId, d],
      );
      const ins = await c.query(
        'insert into meals (user_id, name, day, sort) values ($1, $2, $3, $4) returning id',
        [userId, name, d, sortRes.rows[0].sort],
      );
      return ins.rows[0] as { id: string };
    });

    res.status(201).json({ meal: await loadMeal(userId, tz, created.id) });
  }),
);

// POST /:id/items  → append items to a meal, write a Nutrition activity row.
mealsRouter.post(
  '/:id/items',
  h(async (req, res) => {
    const userId = req.user!.id;
    const tz = req.user!.tz;
    const { items } = itemsBody.parse(req.body);
    const meal = await requireMeal(userId, req.params.id);

    await tx(async (c) => {
      for (const it of items) {
        await c.query(
          `insert into food_items (meal_id, name, kcal, p, c, f, emoji)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [meal.id, it.n, it.kcal, it.p, it.c, it.f, it.emoji ?? null],
        );
      }
      const sumKcal = Math.round(items.reduce((s, i) => s + i.kcal, 0));
      const more = items.length > 1 ? ` +${items.length - 1} more` : '';
      const sub = `${items[0].n}${more} · ${sumKcal} kcal`;
      await writeActivity(c, userId, {
        kind: 'food',
        title: `${meal.name} logged`,
        sub,
        tag: 'Nutrition',
      });
    });

    res.json({ meal: await loadMeal(userId, tz, meal.id) });
  }),
);

// PATCH /:id/items/:i  → patch the i-th item. No activity row.
mealsRouter.patch(
  '/:id/items/:i',
  h(async (req, res) => {
    const userId = req.user!.id;
    const tz = req.user!.tz;
    const { patch } = patchBody.parse(req.body);
    await requireMeal(userId, req.params.id);
    const i = parseIndex(req.params.i);
    const itemId = await itemIdAt(req.params.id, i);

    // Map JSON keys → DB columns (note: item `n` → column `name`).
    const cols: [keyof typeof patch, string][] = [
      ['n', 'name'],
      ['kcal', 'kcal'],
      ['p', 'p'],
      ['c', 'c'],
      ['f', 'f'],
      ['emoji', 'emoji'],
    ];
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [key, col] of cols) {
      const v = patch[key];
      if (v !== undefined) {
        vals.push(v);
        sets.push(`${col} = $${vals.length}`);
      }
    }
    if (sets.length) {
      vals.push(itemId);
      await query(`update food_items set ${sets.join(', ')} where id = $${vals.length}`, vals);
    }

    res.json({ meal: await loadMeal(userId, tz, req.params.id) });
  }),
);

// DELETE /:id/items/:i  → delete the i-th item. No activity row.
mealsRouter.delete(
  '/:id/items/:i',
  h(async (req, res) => {
    const userId = req.user!.id;
    const tz = req.user!.tz;
    await requireMeal(userId, req.params.id);
    const i = parseIndex(req.params.i);
    const itemId = await itemIdAt(req.params.id, i);
    await query('delete from food_items where id = $1', [itemId]);

    res.json({ meal: await loadMeal(userId, tz, req.params.id) });
  }),
);
