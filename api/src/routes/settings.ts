import { Router } from 'express';
import { z } from 'zod';
import { one } from '../db';
import { h, HttpError } from '../lib';

// Settings write endpoints. Mounted at base `/settings`, behind authRequired.
// Each PATCH merges (never replaces) one jsonb column and returns the merged object.
export const settingsRouter = Router();

const patchBody = z.object({ patch: z.record(z.string(), z.unknown()) });

// Merge `patch` into a jsonb settings column via `col || patch` and return the result.
// `column` is a fixed identifier from the route (never user input), safe to interpolate.
async function mergeColumn(userId: string, column: 'goals' | 'preferences' | 'notifications', patch: unknown) {
  const row = await one<Record<string, any>>(
    `update user_settings set ${column} = ${column} || $2::jsonb
     where user_id = $1 returning ${column}`,
    [userId, JSON.stringify(patch)],
  );
  if (!row) throw new HttpError(404, 'Settings not found');
  return row[column];
}

settingsRouter.patch(
  '/goals',
  h(async (req, res) => {
    const { patch } = patchBody.parse(req.body);
    const goals = await mergeColumn(req.user!.id, 'goals', patch);
    res.json({ goals });
  }),
);

settingsRouter.patch(
  '/preferences',
  h(async (req, res) => {
    const { patch } = patchBody.parse(req.body);
    const preferences = await mergeColumn(req.user!.id, 'preferences', patch);
    res.json({ preferences });
  }),
);

settingsRouter.patch(
  '/notifications',
  h(async (req, res) => {
    const { patch } = patchBody.parse(req.body);
    const notifications = await mergeColumn(req.user!.id, 'notifications', patch);
    res.json({ notifications });
  }),
);
