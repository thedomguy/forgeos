import { Router } from 'express';
import { query } from '../db';
import { h, hhmm } from '../lib';

export const timelineRouter = Router();

// GET /timeline?module=all|health|finance|... — cross-module activity feed, newest first.
timelineRouter.get(
  '/',
  h(async (req, res) => {
    const user = req.user!;
    const module = typeof req.query.module === 'string' && req.query.module ? req.query.module : 'all';

    const params: any[] = [user.id];
    let where = 'user_id = $1';
    if (module !== 'all') {
      params.push(module);
      where += ' and module = $2';
    }

    const rows = await query<{
      id: string;
      kind: string;
      module: string;
      title: string;
      sub: string;
      tag: string;
      at: Date;
    }>(
      `select id, kind, module, title, sub, tag, at from activities
       where ${where}
       order by at desc limit 200`,
      params,
    );

    res.json(
      rows.map((a) => ({
        id: a.id,
        t: hhmm(user.tz, new Date(a.at)),
        module: a.module,
        kind: a.kind,
        title: a.title,
        sub: a.sub,
        tag: a.tag,
      })),
    );
  }),
);
