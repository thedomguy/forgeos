import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { one, tx } from '../db';
import { h, HttpError } from '../lib';
import { signToken, setAuthCookie, clearAuthCookie, authRequired } from '../auth';
import { seedUser } from '../seed';

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).optional(),
  tz: z.string().optional(),
});

authRouter.post(
  '/signup',
  h(async (req, res) => {
    const { email, password, name, tz } = credentials.parse(req.body);
    const existing = await one('select id from users where email = $1', [email.toLowerCase()]);
    if (existing) throw new HttpError(409, 'An account with that email already exists');
    const hash = await bcrypt.hash(password, 10);
    const zone = tz || 'UTC';

    const user = await tx(async (c) => {
      const rows = await c.query(
        `insert into users (email, password_hash, name, tz)
         values ($1, $2, $3, $4) returning id, email, name, tz`,
        [email.toLowerCase(), hash, name || 'Alex Morgan', zone],
      );
      const u = rows.rows[0];
      await seedUser(c, u.id, zone);
      return u;
    });

    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user: { email: user.email, name: user.name } });
  }),
);

authRouter.post(
  '/login',
  h(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const user = await one<{ id: string; email: string; name: string; password_hash: string }>(
      'select id, email, name, password_hash from users where email = $1',
      [email.toLowerCase()],
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    setAuthCookie(res, signToken(user.id));
    res.json({ user: { email: user.email, name: user.name } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  authRequired,
  h(async (req, res) => {
    res.json({ user: { email: req.user!.email, name: req.user!.name } });
  }),
);
