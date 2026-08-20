import { Router } from 'express';
import { z } from 'zod';
import { query, one, tx } from '../db';
import { h, HttpError } from '../lib';

// Knowledge module. Mounted at `/notes`, behind authRequired.
//
// The Obsidian vault is the source of truth (ADR 0001); the sync daemon pushes
// notes here one-way and the app renders from this mirror. Read state, by
// contrast, originates here and is never written back to the vault (ADR 0005).
export const notesRouter = Router();

const noteInput = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  body: z.string(),
  contentHash: z.string().trim().min(1),
  created: z.string().nullable().optional(),
  lastUpdated: z.string().nullable().optional(),
});

const syncBody = z.object({
  notes: z.array(noteInput),
  // When true, notes not present in this payload are soft-deleted. The daemon
  // sends the complete vault every run, so this reflects genuine deletions.
  // Guarded so a partial/failed scan can never wipe the mirror.
  prune: z.boolean().default(false),
});

// Empty-ish date strings from frontmatter (`last_read:` with no value) must
// become NULL, not ''. Postgres would reject '' for a date column.
const nullableDate = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

notesRouter.post(
  '/sync',
  h(async (req, res) => {
    const { notes, prune } = syncBody.parse(req.body);
    const userId = req.user!.id;

    const result = await tx(async (c) => {
      let inserted = 0;
      let updated = 0;
      let unchanged = 0;

      for (const n of notes) {
        // Skip the write entirely when nothing changed — keeps `synced_at`
        // meaningful and avoids churning rows on every filesystem event.
        const existing = await c.query(
          'select id, content_hash, deleted_at from notes where user_id = $1 and slug = $2',
          [userId, n.slug],
        );
        const row = existing.rows[0];

        if (row && row.content_hash === n.contentHash && !row.deleted_at) {
          unchanged++;
          continue;
        }

        await c.query(
          `insert into notes
             (user_id, slug, title, domain, tags, aliases, body, content_hash,
              created, last_updated, synced_at, deleted_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), null)
           on conflict (user_id, slug) do update set
             title        = excluded.title,
             domain       = excluded.domain,
             tags         = excluded.tags,
             aliases      = excluded.aliases,
             body         = excluded.body,
             content_hash = excluded.content_hash,
             created      = excluded.created,
             last_updated = excluded.last_updated,
             synced_at    = now(),
             deleted_at   = null`,
          [
            userId, n.slug, n.title, n.domain, n.tags, n.aliases, n.body,
            n.contentHash, nullableDate(n.created), nullableDate(n.lastUpdated),
          ],
        );
        row ? updated++ : inserted++;
      }

      let pruned = 0;
      if (prune) {
        const slugs = notes.map((n) => n.slug);
        const r = await c.query(
          `update notes set deleted_at = now()
           where user_id = $1 and deleted_at is null and not (slug = any($2::text[]))`,
          [userId, slugs],
        );
        pruned = r.rowCount ?? 0;
      }

      return { inserted, updated, unchanged, pruned };
    });

    res.json(result);
  }),
);

// List every live note with its read state. Bodies are omitted — the list view
// doesn't need them and they dominate the payload.
notesRouter.get(
  '/',
  h(async (req, res) => {
    const rows = await query(
      `select n.slug, n.title, n.domain, n.tags, n.aliases,
              n.created, n.last_updated as "lastUpdated",
              length(n.body) as "bodyLength",
              coalesce(r.status, 'unread')   as status,
              coalesce(r.scroll_pct, 0)      as "scrollPct",
              r.last_read_at                 as "lastReadAt"
         from notes n
         left join note_read_state r
           on r.note_id = n.id and r.user_id = n.user_id
        where n.user_id = $1 and n.deleted_at is null
        order by n.domain asc, n.created asc nulls last, n.title asc`,
      [req.user!.id],
    );
    res.json({ notes: rows });
  }),
);

notesRouter.get(
  '/:slug',
  h(async (req, res) => {
    const note = await one(
      `select n.slug, n.title, n.domain, n.tags, n.aliases, n.body,
              n.created, n.last_updated as "lastUpdated",
              coalesce(r.status, 'unread') as status,
              coalesce(r.scroll_pct, 0)    as "scrollPct",
              r.last_read_at               as "lastReadAt"
         from notes n
         left join note_read_state r
           on r.note_id = n.id and r.user_id = n.user_id
        where n.user_id = $1 and n.slug = $2 and n.deleted_at is null`,
      [req.user!.id, req.params.slug],
    );
    if (!note) throw new HttpError(404, 'Note not found');
    res.json({ note });
  }),
);

const progressBody = z.object({
  scrollPct: z.number().min(0).max(1).optional(),
  status: z.enum(['unread', 'reading', 'read']).optional(),
});

// Record reading progress. Called as the user scrolls (debounced client-side)
// and when a note is opened/finished.
notesRouter.put(
  '/:slug/progress',
  h(async (req, res) => {
    const { scrollPct, status } = progressBody.parse(req.body);
    if (scrollPct === undefined && status === undefined) {
      throw new HttpError(400, 'Nothing to update');
    }
    const userId = req.user!.id;

    const note = await one<{ id: string }>(
      'select id from notes where user_id = $1 and slug = $2 and deleted_at is null',
      [userId, req.params.slug],
    );
    if (!note) throw new HttpError(404, 'Note not found');

    // first_read_at is set once and never moved; last_read_at tracks the most
    // recent visit. Both are timestamps rather than a boolean so read history
    // could later be replayed back into the vault (ADR 0005).
    const row = await one(
      `insert into note_read_state
         (user_id, note_id, status, scroll_pct, first_read_at, last_read_at, updated_at)
       values ($1, $2, coalesce($3, 'reading'), coalesce($4, 0), now(), now(), now())
       on conflict (user_id, note_id) do update set
         status        = coalesce($3, note_read_state.status),
         scroll_pct    = coalesce($4, note_read_state.scroll_pct),
         first_read_at = coalesce(note_read_state.first_read_at, now()),
         last_read_at  = now(),
         updated_at    = now()
       returning status, scroll_pct as "scrollPct", last_read_at as "lastReadAt"`,
      [userId, note.id, status ?? null, scrollPct ?? null],
    );
    res.json(row);
  }),
);
