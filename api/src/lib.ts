import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PoolClient } from 'pg';
import { pool } from './db';

// Wrap async route handlers so thrown errors reach the error middleware.
export const h =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) =>
    fn(req, res, next).catch(next);

// Throw this for expected client/business errors; error middleware maps .status.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ── time / day helpers (per-user timezone) ─────────────────────
// Current calendar day in the user's tz, as 'YYYY-MM-DD'.
export function dayFor(tz: string, d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: tz || 'UTC' });
}
// 'HH:MM' (24h) in the user's tz — matches the frontend timeline `t` field.
export function hhmm(tz: string, d = new Date()): string {
  return d.toLocaleTimeString('en-GB', {
    timeZone: tz || 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ── canonical meals ────────────────────────────────────────────
// The four meals every day starts with. `sort` orders them in the UI.
export const CANONICAL_MEALS: { name: string; sort: number }[] = [
  { name: 'Breakfast', sort: 0 },
  { name: 'Lunch', sort: 1 },
  { name: 'Snack', sort: 2 },
  { name: 'Dinner', sort: 3 },
];

// Ensure the 4 canonical meals exist for (user, day). Idempotent — relies on the
// unique(user_id, day, name) constraint. Call from GET /state and from seed.
export async function ensureDayMeals(
  client: PoolClient | typeof pool,
  userId: string,
  day: string,
): Promise<void> {
  for (const m of CANONICAL_MEALS) {
    await client.query(
      `insert into meals (user_id, name, day, sort) values ($1, $2, $3, $4)
       on conflict (user_id, day, name) do nothing`,
      [userId, m.name, day, m.sort],
    );
  }
}

// ── activity feed ──────────────────────────────────────────────
// Write one timeline row. Call this after every mutating action.
export async function writeActivity(
  client: PoolClient | typeof pool,
  userId: string,
  a: { kind: string; title: string; sub?: string; tag?: string; module?: string },
): Promise<void> {
  await client.query(
    `insert into activities (user_id, kind, module, title, sub, tag)
     values ($1, $2, $3, $4, $5, $6)`,
    [userId, a.kind, a.module ?? 'health', a.title, a.sub ?? '', a.tag ?? ''],
  );
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
