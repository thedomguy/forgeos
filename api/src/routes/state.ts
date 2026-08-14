import { Router } from 'express';
import { pool, query, one } from '../db';
import { h, dayFor, hhmm, ensureDayMeals, round1 } from '../lib';

export const stateRouter = Router();

// Format a timestamp as 'Mon D' (e.g. 'Jun 3') in the user's tz — matches WEIGHT_DATES.
function monDay(at: Date, tz: string): string {
  return new Date(at).toLocaleDateString('en-US', {
    timeZone: tz || 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

const BODY_KEYS = ['weight', 'bodyfat', 'waist'] as const;

// GET /state?day=YYYY-MM-DD — the full health snapshot for a day (see CONTRACTS.md §GET /state).
stateRouter.get(
  '/',
  h(async (req, res) => {
    const user = req.user!;
    const day = typeof req.query.day === 'string' && req.query.day ? req.query.day : dayFor(user.tz);

    // Guarantee the 4 canonical meals exist for the day.
    await ensureDayMeals(pool, user.id, day);

    // ── settings ────────────────────────────────────────────────
    const settingsRow = await one<{ goals: any; preferences: any; notifications: any }>(
      'select goals, preferences, notifications from user_settings where user_id = $1',
      [user.id],
    );
    const goals = settingsRow?.goals ?? {};
    const preferences = settingsRow?.preferences ?? {};
    const notifications = settingsRow?.notifications ?? {};

    // ── per-day aggregates (calories out, steps, water) ─────────
    const agg = await one<{
      walk_kcal: string;
      workout_kcal: string;
      steps: string;
      ml: string;
    }>(
      `select
         (select coalesce(sum(kcal), 0) from walks     where user_id = $1 and day = $2) as walk_kcal,
         (select coalesce(sum(kcal), 0) from workouts  where user_id = $1 and day = $2) as workout_kcal,
         (select coalesce(sum(steps), 0) from walks    where user_id = $1 and day = $2) as steps,
         (select coalesce(sum(ml), 0) from water_logs  where user_id = $1 and day = $2) as ml`,
      [user.id, day],
    );
    const caloriesOut = Number(agg?.walk_kcal ?? 0) + Number(agg?.workout_kcal ?? 0);
    const steps = Number(agg?.steps ?? 0);
    const waterV = round1(Number(agg?.ml ?? 0) / 1000);

    // ── latest weight (any day) ─────────────────────────────────
    const latestWeight = await one<{ value: string }>(
      `select value from body_measurements
       where user_id = $1 and metric = 'weight'
       order by logged_at desc limit 1`,
      [user.id],
    );
    const weightNow = latestWeight ? Number(latestWeight.value) : 0;

    // ── meals + food items for the day ──────────────────────────
    const mealRows = await query<{ id: string; name: string; logged_at: Date; sort: number }>(
      `select id, name, logged_at, sort from meals
       where user_id = $1 and day = $2
       order by sort, logged_at`,
      [user.id, day],
    );
    const itemRows = await query<{
      meal_id: string;
      name: string;
      kcal: string;
      p: string;
      c: string;
      f: string;
      emoji: string | null;
      logged_at: Date;
    }>(
      `select fi.meal_id, fi.name, fi.kcal, fi.p, fi.c, fi.f, fi.emoji, fi.logged_at
       from food_items fi
       join meals m on m.id = fi.meal_id
       where m.user_id = $1 and m.day = $2
       order by fi.logged_at`,
      [user.id, day],
    );

    // group items by meal (rows already ordered by logged_at ascending)
    const itemsByMeal = new Map<string, { items: any[]; earliest: Date | null }>();
    let macroP = 0;
    let macroC = 0;
    let macroF = 0;
    for (const it of itemRows) {
      const p = Number(it.p);
      const c = Number(it.c);
      const f = Number(it.f);
      macroP += p;
      macroC += c;
      macroF += f;
      let g = itemsByMeal.get(it.meal_id);
      if (!g) {
        g = { items: [], earliest: null };
        itemsByMeal.set(it.meal_id, g);
      }
      if (g.earliest === null) g.earliest = it.logged_at;
      g.items.push({ n: it.name, kcal: Number(it.kcal), p, c, f, emoji: it.emoji });
    }

    const meals = mealRows.map((m) => {
      const g = itemsByMeal.get(m.id);
      const items = g?.items ?? [];
      const kcal = items.reduce((s: number, i: any) => s + i.kcal, 0);
      const timeAt = g?.earliest ?? m.logged_at;
      return { id: m.id, meal: m.name, time: hhmm(user.tz, new Date(timeAt)), kcal, items };
    });

    // ── body measurement series (weight/bodyfat/waist) ──────────
    const measRows = await query<{ metric: string; value: string; logged_at: Date }>(
      `select metric, value, logged_at from body_measurements
       where user_id = $1 and metric = any($2)
       order by logged_at asc`,
      [user.id, BODY_KEYS as unknown as string[]],
    );
    const seriesByMetric = new Map<string, { values: number[]; dates: string[] }>();
    for (const key of BODY_KEYS) seriesByMetric.set(key, { values: [], dates: [] });
    for (const r of measRows) {
      const bucket = seriesByMetric.get(r.metric);
      if (!bucket) continue;
      bucket.values.push(Number(r.value));
      bucket.dates.push(monDay(r.logged_at, user.tz));
    }

    const weightBucket = seriesByMetric.get('weight')!;
    const weightSeries = weightBucket.values;
    const weightGoal = goals.weight ?? 0;
    const weight = {
      series: weightSeries,
      dates: weightBucket.dates,
      current: weightSeries.length ? weightSeries[weightSeries.length - 1] : weightNow,
      goal: weightGoal,
      start: weightSeries.length ? weightSeries[0] : weightNow,
    };

    const bodyMetrics = BODY_KEYS.map((key) => {
      const b = seriesByMetric.get(key)!;
      const s = b.values;
      const first = s.length ? s[0] : 0;
      const last = s.length ? s[s.length - 1] : 0;
      return {
        key,
        v: last,
        delta: round1(last - first),
        series: s,
        goal: goals[key] ?? 0,
      };
    });

    // ── timeline (newest ~50) ───────────────────────────────────
    const actRows = await query<{
      id: string;
      kind: string;
      module: string;
      title: string;
      sub: string;
      tag: string;
      at: Date;
    }>(
      `select id, kind, module, title, sub, tag, at from activities
       where user_id = $1
       order by at desc limit 50`,
      [user.id],
    );
    const timeline = actRows.map((a) => ({
      id: a.id,
      t: hhmm(user.tz, new Date(a.at)),
      module: a.module,
      kind: a.kind,
      title: a.title,
      sub: a.sub,
      tag: a.tag,
    }));

    res.json({
      today: {
        caloriesGoal: goals.calories ?? 0,
        caloriesOut,
        water: { v: waterV, goal: 3.0 },
        steps,
        stepsGoal: 10000,
        weight: weightNow,
        weightGoal,
      },
      macros: { protein: macroP, carbs: macroC, fat: macroF },
      meals,
      weight,
      bodyMetrics,
      timeline,
      settings: { goals, preferences, notifications },
    });
  }),
);
