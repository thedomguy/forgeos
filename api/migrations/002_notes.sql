-- Knowledge module: a mirror of the Obsidian vault's Learning/ notes.
--
-- The vault (plain markdown on disk) stays the source of truth — see
-- learning-notes-system/planning ADR 0001. This table is a read-mirror the app
-- renders from; the sync daemon pushes into it one-way. Nothing here is written
-- back to the vault.
create table if not exists notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  -- filename stem (e.g. '2026-08-20 001 Fish Shell Fundamentals for JS Developers').
  -- Stable identity across syncs; the vault guarantees uniqueness.
  slug         text not null,
  title        text not null,
  domain       text not null,
  tags         text[] not null default '{}',
  aliases      text[] not null default '{}',
  -- markdown body with frontmatter stripped; rendered client-side
  body         text not null,
  -- sha256 of body+metadata, so the daemon can skip unchanged notes cheaply
  content_hash text not null,
  created      date,
  last_updated date,
  synced_at    timestamptz not null default now(),
  -- soft delete: set when a note disappears from the vault, so read state
  -- survives an accidental delete / rename round-trip
  deleted_at   timestamptz,
  unique (user_id, slug)
);

create index if not exists notes_user_domain
  on notes(user_id, domain) where deleted_at is null;
create index if not exists notes_user_updated
  on notes(user_id, last_updated desc) where deleted_at is null;

-- Read state. Per ADR 0005 this is authoritative here and never written back to
-- the vault's frontmatter. Deliberately stores read *timestamps* rather than a
-- bare boolean so a future write-back job could reconstruct `last_read`
-- accurately — that decision is meant to stay reversible.
--
-- scroll_pct is the fraction (0..1) of the article scrolled, so reopening a note
-- resumes where you left off instead of jumping to the top.
create table if not exists note_read_state (
  user_id       uuid not null references users(id) on delete cascade,
  note_id       uuid not null references notes(id) on delete cascade,
  status        text not null default 'unread'
                  check (status in ('unread', 'reading', 'read')),
  scroll_pct    real not null default 0 check (scroll_pct >= 0 and scroll_pct <= 1),
  first_read_at timestamptz,
  last_read_at  timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, note_id)
);

create index if not exists note_read_state_user_status
  on note_read_state(user_id, status);
