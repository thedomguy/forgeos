// Shared request typing. authRequired middleware guarantees req.user is set.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tz: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
