import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { one } from './db';
import { HttpError, h } from './lib';
import { AuthUser } from './types';

const COOKIE = 'forge_token';

export function signToken(userId: string): string {
  return jwt.sign({ uid: userId }, config.jwtSecret, { expiresIn: '30d' });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    domain: config.cookieDomain,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE, { domain: config.cookieDomain, path: '/' });
}

// Guard: verifies the cookie, loads the user, sets req.user. 401 otherwise.
export const authRequired = h(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Not authenticated');
  let uid: string;
  try {
    uid = (jwt.verify(token, config.jwtSecret) as { uid: string }).uid;
  } catch {
    throw new HttpError(401, 'Invalid session');
  }
  const user = await one<AuthUser>(
    'select id, email, name, tz from users where id = $1',
    [uid],
  );
  if (!user) throw new HttpError(401, 'User no longer exists');
  req.user = user;
  next();
});
