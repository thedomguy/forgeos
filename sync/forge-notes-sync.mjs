#!/usr/bin/env node
// forge-notes-sync — pushes the Obsidian Learning vault into the Forge OS API.
//
// The vault is the source of truth (ADR 0001); this is a one-way mirror. Read
// state lives server-side and is never written back here (ADR 0005), so this
// script only ever *reads* the vault. It will not modify a single note.
//
// Modes:
//   --once     scan and push, then exit        (what /learn calls after capture)
//   --watch    stay resident, re-sync on change (the daemon; launchd keeps it alive)
//
// Config: ~/.config/forge-sync/config.json  (chmod 600)
//   { "apiBase": "...", "identifier": "...", "password": "...",
//     "vault": "...", "notesSubfolder": "Learning" }
// Vault path falls back to ~/.claude/learn-config.json so there's one source for it.
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const CONFIG_DIR = join(homedir(), '.config', 'forge-sync');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const COOKIE_PATH = join(CONFIG_DIR, 'cookie.txt');
const LEARN_CONFIG = join(homedir(), '.claude', 'learn-config.json');
const DEBOUNCE_MS = 1500;

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function loadConfig() {
  const cfg = await readJson(CONFIG_PATH);
  if (!cfg) {
    console.error(`Missing ${CONFIG_PATH}. Create it with:
  { "apiBase": "https://api.domguy.dev/fg/v1",
    "identifier": "rahul", "password": "…" }`);
    process.exit(1);
  }
  if (!cfg.vault) {
    const learn = await readJson(LEARN_CONFIG);
    cfg.vault = learn?.obsidian_vault;
    cfg.notesSubfolder ||= learn?.notes_subfolder || 'Learning';
  }
  cfg.notesSubfolder ||= 'Learning';
  cfg.apiBase ||= 'https://api.domguy.dev/fg/v1';
  if (!cfg.vault) {
    console.error('No vault path in config or ~/.claude/learn-config.json');
    process.exit(1);
  }
  return cfg;
}

// ── vault parsing ──────────────────────────────────────────────
const FM_RE = /^---\n([\s\S]*?)\n---\n?/;

// Minimal YAML subset — enough for this frontmatter schema (flat scalars and
// `[a, b]` inline lists). Deliberately not a full YAML parser: the schema is
// tool-generated and fixed, so a dependency would buy nothing.
function parseFrontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return { fields: {}, body: text };
  const fields = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      fields[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      fields[key] = val;
    }
  }
  return { fields, body: text.slice(m[0].length) };
}

async function collectNotes(learningDir) {
  const notes = [];
  let entries;
  try {
    entries = await readdir(learningDir, { withFileTypes: true });
  } catch {
    throw new Error(`Learning directory not found: ${learningDir}`);
  }

  for (const e of entries) {
    // Only domain folders hold notes. MOCs/ is generated navigation, and the
    // root holds Learning Home.md / Reading Log.md — all derived, not source.
    if (!e.isDirectory() || e.name === 'MOCs' || e.name.startsWith('.')) continue;
    const domainDir = join(learningDir, e.name);
    for (const f of await readdir(domainDir)) {
      if (!f.endsWith('.md')) continue;
      const raw = await readFile(join(domainDir, f), 'utf8');
      const { fields, body } = parseFrontmatter(raw);
      const slug = f.slice(0, -3);
      const note = {
        slug,
        title: fields.title || slug,
        domain: fields.domain || e.name,
        tags: fields.tags || [],
        aliases: fields.aliases || [],
        body,
        created: fields.created || null,
        lastUpdated: fields.last_updated || null,
      };
      // Hash covers everything we send, so any edit — body or metadata —
      // produces a new hash and the server rewrites the row.
      note.contentHash = createHash('sha256')
        .update(
          JSON.stringify([
            note.title, note.domain, note.tags, note.aliases,
            note.body, note.created, note.lastUpdated,
          ]),
        )
        .digest('hex');
      notes.push(note);
    }
  }
  return notes;
}

// ── API ────────────────────────────────────────────────────────
let cookie = null;

async function loadCookie() {
  try {
    cookie = (await readFile(COOKIE_PATH, 'utf8')).trim() || null;
  } catch {
    cookie = null;
  }
}

async function login(cfg) {
  const res = await fetch(`${cfg.apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.identifier, password: cfg.password }),
  });
  if (!res.ok) {
    throw new Error(`login failed (${res.status}): ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('login succeeded but no cookie returned');
  cookie = setCookie.split(';')[0];
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(COOKIE_PATH, cookie, { mode: 0o600 });
  log('logged in');
}

async function pushNotes(cfg, notes) {
  const send = () =>
    fetch(`${cfg.apiBase}/notes/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
      // prune is safe here because collectNotes always walks the whole vault —
      // a partial scan throws before reaching this point rather than pruning.
      body: JSON.stringify({ notes, prune: true }),
    });

  let res = await send();
  if (res.status === 401) {
    log('session expired, re-authenticating');
    await login(cfg);
    res = await send();
  }
  if (!res.ok) throw new Error(`sync failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function syncOnce(cfg) {
  const learningDir = join(cfg.vault, cfg.notesSubfolder);
  const notes = await collectNotes(learningDir);
  if (!notes.length) {
    log('no notes found — refusing to sync (would prune everything)');
    return;
  }
  if (!cookie) await loadCookie();
  if (!cookie) await login(cfg);
  const r = await pushNotes(cfg, notes);
  log(
    `synced ${notes.length} notes — +${r.inserted} new, ~${r.updated} updated, ` +
      `=${r.unchanged} unchanged, -${r.pruned} removed`,
  );
}

// ── watch mode ─────────────────────────────────────────────────
function watchMode(cfg) {
  const learningDir = join(cfg.vault, cfg.notesSubfolder);
  let timer = null;
  let running = false;
  let queued = false;

  const run = async () => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await syncOnce(cfg);
    } catch (e) {
      console.error('sync error:', e.message);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        schedule();
      }
    }
  };

  // Obsidian writes a file several times per save (and touches siblings), so
  // coalesce bursts into a single sync rather than hammering the API.
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE_MS);
  };

  watch(learningDir, { recursive: true }, (_ev, filename) => {
    if (filename && filename.endsWith('.md')) schedule();
  });
  log(`watching ${learningDir}`);
  run(); // initial sync on start
}

// ── main ───────────────────────────────────────────────────────
const mode = process.argv.includes('--watch') ? 'watch' : 'once';
const cfg = await loadConfig();
if (mode === 'watch') {
  watchMode(cfg);
} else {
  try {
    await syncOnce(cfg);
  } catch (e) {
    console.error('sync error:', e.message);
    process.exit(1);
  }
}
