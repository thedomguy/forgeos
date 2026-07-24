import { Router } from 'express';
import { PoolClient } from 'pg';
import { z } from 'zod';
import { tx } from '../db';
import { h, dayFor, hhmm, round1 } from '../lib';

// Activity-log write endpoints. Mounted at root, behind authRequired.
// Each: insert the domain row, insert an activity row (RETURNING id, at so we
// get the identity atomically), then return { ok:true, entry } where `entry` is
// the new row in the GET /timeline item shape.
export const logRouter = Router();

// Insert one activity row and return the freshly-written timeline `entry`.
// Mirrors writeActivity's columns, but with RETURNING so we get id+at back.
async function insertEntry(
  client: PoolClient,
  userId: string,
  tz: string,
  a: { kind: string; title: string; sub: string; tag: string },
) {
  const { rows } = await client.query<{ id: string; at: Date }>(
    `insert into activities (user_id, kind, module, title, sub, tag)
     values ($1, $2, 'health', $3, $4, $5)
     returning id, at`,
    [userId, a.kind, a.title, a.sub, a.tag],
  );
  const row = rows[0];
  return {
    id: row.id,
    t: hhmm(tz, row.at),
    module: 'health' as const,
    kind: a.kind,
    title: a.title,
    sub: a.sub,
    tag: a.tag,
  };
}

const weightBody = z.object({ kg: z.number() });

logRouter.post(
  '/weight',
  h(async (req, res) => {
    const { id, tz } = req.user!;
    const { kg } = weightBody.parse(req.body);
    const day = dayFor(tz);

    const entry = await tx(async (c) => {
      // Previous weight measurement (latest before this insert).
      const prev = await c.query<{ value: string }>(
        `select value from body_measurements
         where user_id = $1 and metric = 'weight'
         order by logged_at desc limit 1`,
        [id],
      );
      const delta = prev.rows[0] ? kg - Number(prev.rows[0].value) : 0;

      await c.query(
        `insert into body_measurements (user_id, metric, value, day)
         values ($1, 'weight', $2, $3)`,
        [id, kg, day],
      );

      const sub = `${kg.toFixed(1)} kg · ${delta >= 0 ? '+' : ''}${round1(delta)} from last`;
      return insertEntry(c, id, tz, { kind: 'weight', title: 'Weight updated', sub, tag: 'Body' });
    });

    res.json({ ok: true, entry });
  }),
);

const waterBody = z.object({ ml: z.number() });

logRouter.post(
  '/water',
  h(async (req, res) => {
    const { id, tz } = req.user!;
    const { ml } = waterBody.parse(req.body);
    const day = dayFor(tz);

    const entry = await tx(async (c) => {
      await c.query(
        `insert into water_logs (user_id, ml, day) values ($1, $2, $3)`,
        [id, ml, day],
      );
      // Total for today, computed AFTER the insert.
      const sum = await c.query<{ total: string | null }>(
        `select coalesce(sum(ml), 0) as total from water_logs where user_id = $1 and day = $2`,
        [id, day],
      );
      const todayL = round1(Number(sum.rows[0].total) / 1000);
      const sub = `+${ml} ml · ${todayL} L today`;
      return insertEntry(c, id, tz, { kind: 'water', title: 'Water logged', sub, tag: 'Hydration' });
    });

    res.json({ ok: true, entry });
  }),
);

const walkBody = z.object({
  km: z.number(),
  min: z.number(),
  kcal: z.number(),
  steps: z.number().optional(),
});

logRouter.post(
  '/walks',
  h(async (req, res) => {
    const { id, tz } = req.user!;
    const { km, min, kcal, steps } = walkBody.parse(req.body);
    const day = dayFor(tz);
    const stepCount = steps ?? Math.round(km * 1300);

    const entry = await tx(async (c) => {
      await c.query(
        `insert into walks (user_id, km, min, kcal, steps, day)
         values ($1, $2, $3, $4, $5, $6)`,
        [id, km, min, kcal, stepCount, day],
      );
      const sub = `${km} km · ${min} min · ${kcal} kcal`;
      return insertEntry(c, id, tz, { kind: 'walk', title: 'Walk tracked', sub, tag: 'Activity' });
    });

    res.json({ ok: true, entry });
  }),
);

const workoutBody = z.object({
  name: z.string().trim().min(1),
  mins: z.number(),
  sets: z.number(),
  exercises: z.number(),
  kcal: z.number().optional(),
});

logRouter.post(
  '/workouts',
  h(async (req, res) => {
    const { id, tz } = req.user!;
    const { name, mins, sets, exercises, kcal } = workoutBody.parse(req.body);
    const day = dayFor(tz);
    const kcalOut = kcal ?? Math.round(mins * 8);

    const entry = await tx(async (c) => {
      await c.query(
        `insert into workouts (user_id, name, mins, sets, exercises, kcal, day)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [id, name, mins, sets, exercises, kcalOut, day],
      );
      const sub = `${mins} min · ${exercises} exercises · ${sets} sets`;
      return insertEntry(c, id, tz, {
        kind: 'workout',
        title: `${name} workout completed`,
        sub,
        tag: 'Training',
      });
    });

    res.json({ ok: true, entry });
  }),
);
