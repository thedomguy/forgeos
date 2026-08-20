// knowledge.jsx — the Knowledge module: browse and read the Obsidian Learning vault.
//
// Notes come from the API's mirror of the vault (the vault itself stays the
// source of truth). Read state — including scroll position — lives server-side,
// so where you stopped reading on the phone is where you resume on the laptop.
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Screen, Card, Chip, Tag } from './ui.jsx';
import { ScreenHeader, SectionLabel } from './screens.jsx';
import { Icon } from './icons.jsx';
import { Markdown } from './markdown.jsx';
import * as api from './api.js';
import { FONT, MONO, HUE, STATUS_H, NAV_H, SCREEN_PAD_X, Z, RADIUS } from './theme.jsx';

const DOMAIN_LABEL = { auth: 'Auth', git: 'Git', infra: 'Infra', shell: 'Shell', swift: 'Swift' };
// Stable per-domain accent so a domain reads the same colour everywhere.
const DOMAIN_HUE = {
  auth: HUE.protein, git: HUE.workout, infra: HUE.learning,
  shell: HUE.burn, swift: HUE.fat,
};
const hueFor = (d) => DOMAIN_HUE[d] || HUE.learning;
const labelFor = (d) => DOMAIN_LABEL[d] || (d ? d[0].toUpperCase() + d.slice(1) : 'Other');

// Rough reading time from body length — notes carry no word count, and this is
// only ever a hint, so characters/5 words at 220wpm is close enough.
const readMins = (chars) => Math.max(1, Math.round(chars / 5 / 220));

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

// ── list ───────────────────────────────────────────────────────
export function KnowledgeScreen({ theme, nav, onOpen }) {
  const t = theme;
  const [notes, setNotes] = useState(null);
  const [err, setErr] = useState(null);
  const [domain, setDomain] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    api.get('/notes')
      .then((r) => { setNotes(r.notes || []); setErr(null); })
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  const domains = useMemo(() => {
    if (!notes) return [];
    const counts = {};
    for (const n of notes) counts[n.domain] = (counts[n.domain] || 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [notes]);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const needle = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (domain !== 'all' && n.domain !== domain) return false;
      if (!needle) return true;
      return (
        n.title.toLowerCase().includes(needle) ||
        (n.tags || []).some((x) => x.toLowerCase().includes(needle))
      );
    });
  }, [notes, domain, q]);

  const grouped = useMemo(() => {
    const g = {};
    for (const n of filtered) (g[n.domain] ||= []).push(n);
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const unreadCount = notes ? notes.filter((n) => n.status !== 'read').length : 0;

  return (
    <Screen theme={t}>
      <ScreenHeader theme={t} nav={nav} sub="Knowledge"
        title={notes ? `${notes.length} notes` : 'Notes'} />

      {/* search */}
      <div style={{ padding: `0 ${SCREEN_PAD_X}px 4px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.surface,
          border: `1px solid ${t.border}`, borderRadius: RADIUS.control, padding: '11px 13px' }}>
          <Icon name="search" size={17} style={{ color: t.text3, flexShrink: 0 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes and tags"
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
              color: t.text, fontFamily: FONT, fontSize: 15 }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none',
            color: t.text3, cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Icon name="close" size={16} /></button>}
        </div>
      </div>

      {/* domain filter */}
      {domains.length > 0 && (
        <div className="forge-hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto',
          padding: `12px ${SCREEN_PAD_X}px 2px` }}>
          <Chip theme={t} active={domain === 'all'} onClick={() => setDomain('all')}>
            All{unreadCount ? ` · ${unreadCount} unread` : ''}
          </Chip>
          {domains.map(([d, c]) => (
            <Chip key={d} theme={t} active={domain === d} accent={hueFor(d)}
              onClick={() => setDomain(domain === d ? 'all' : d)}>{labelFor(d)} · {c}</Chip>
          ))}
        </div>
      )}

      {err && (
        <div style={{ padding: `18px ${SCREEN_PAD_X}px` }}>
          <Card theme={t} style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Couldn't load notes</div>
            <div style={{ fontSize: 13, color: t.text2 }}>{err}</div>
            <button onClick={load} style={{ marginTop: 12, background: t.accent.solid + '1f',
              color: t.accent.solid, border: `1px solid ${t.accent.solid}33`, borderRadius: 10,
              padding: '8px 14px', fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
              Retry</button>
          </Card>
        </div>
      )}

      {!notes && !err && (
        <div style={{ padding: `40px ${SCREEN_PAD_X}px`, textAlign: 'center', color: t.text3, fontSize: 14 }}>
          Loading notes…
        </div>
      )}

      {notes && !err && filtered.length === 0 && (
        <div style={{ padding: `40px ${SCREEN_PAD_X}px`, textAlign: 'center' }}>
          <Icon name="book" size={30} style={{ color: t.text3 }} />
          <div style={{ marginTop: 10, fontSize: 14.5, color: t.text2 }}>
            {q ? `Nothing matches "${q}"` : 'No notes yet'}
          </div>
          {!q && <div style={{ marginTop: 6, fontSize: 13, color: t.text3 }}>
            Capture one with <code style={{ fontFamily: MONO }}>/learn</code>, then it syncs here.</div>}
        </div>
      )}

      {grouped.map(([d, items]) => (
        <div key={d}>
          <SectionLabel theme={t}>{labelFor(d)}</SectionLabel>
          <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {items.map((n) => <NoteRow key={n.slug} note={n} theme={t} onClick={() => onOpen(n.slug)} />)}
          </div>
        </div>
      ))}
      <div style={{ height: 10 }} />
    </Screen>
  );
}

function NoteRow({ note, theme: t, onClick }) {
  const hue = hueFor(note.domain);
  const unread = note.status !== 'read';
  const progress = note.scrollPct || 0;
  const inProgress = note.status === 'reading' && progress > 0.02 && progress < 0.98;

  return (
    <Card theme={t} onClick={onClick} className="forge-press" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* unread dot — the one at-a-glance signal that survives a long list */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
          background: unread ? hue : 'transparent',
          border: unread ? 'none' : `1.5px solid ${t.border2}` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: unread ? 650 : 550, lineHeight: 1.35,
            color: unread ? t.text : t.text2 }}>{note.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <Tag theme={t} color={hue}>{labelFor(note.domain)}</Tag>
            <span style={{ fontSize: 12, color: t.text3 }}>{readMins(note.bodyLength)} min</span>
            {note.created && <span style={{ fontSize: 12, color: t.text3 }}>· {fmtDate(note.created)}</span>}
          </div>
          {inProgress && (
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 100, background: t.track, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: hue }} />
              </div>
              <span style={{ fontSize: 11, color: t.text3, fontFamily: MONO }}>
                {Math.round(progress * 100)}%</span>
            </div>
          )}
        </div>
        <Icon name="chevronRight" size={18} style={{ color: t.text3, flexShrink: 0, marginTop: 3 }} />
      </div>
    </Card>
  );
}

// ── reader ─────────────────────────────────────────────────────
export function NoteReader({ theme, nav, slug, onBack }) {
  const t = theme;
  const [note, setNote] = useState(null);
  const [err, setErr] = useState(null);
  const scrollRef = useRef(null);
  const restoredRef = useRef(false);
  const userTookOverRef = useRef(false);
  const saveTimer = useRef(null);
  const lastSaved = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    restoredRef.current = false;
    setNote(null); setErr(null); setProgress(0);
    api.get(`/notes/${encodeURIComponent(slug)}`)
      .then((r) => setNote(r.note))
      .catch((e) => setErr(e.message));
  }, [slug]);

  // Restore the saved scroll position.
  //
  // Naively scrolling once (even after a couple of rAFs) lands at 0: <Markdown>
  // commits its HTML a tick later, and then highlight.js and mermaid change the
  // height again as they enhance the content asynchronously. So instead of
  // guessing when layout is "done", keep re-pinning to the target percentage
  // whenever the content resizes — until the user actually takes over.
  useEffect(() => {
    if (!note) return;
    const el = scrollRef.current;
    if (!el) return;

    const pct = note.scrollPct || 0;
    // Seed lastSaved so the restore's own scroll events aren't written back.
    lastSaved.current = pct;
    userTookOverRef.current = false;
    restoredRef.current = true;
    setProgress(pct);
    if (pct <= 0.01) return;

    // Re-pin the target position for a short window. Deliberately not keyed to
    // a content ref or a "layout done" signal: the height changes several times
    // (markdown commit, then highlight.js, then each mermaid SVG), and any
    // single-shot restore races one of them.
    //
    // A timer rather than requestAnimationFrame — rAF is suspended entirely
    // while the tab is hidden or occluded, so a note opened in a background tab
    // would never be pinned at all. A restore isn't an animation; 100ms
    // granularity is imperceptible.
    const deadline = Date.now() + 3000;
    const timer = setInterval(() => {
      // Read the scroller fresh each pass rather than closing over it: if React
      // swaps the node during the null->loaded transition, a captured reference
      // is detached and silently accepts scrollTop writes forever.
      const node = scrollRef.current;
      if (!node || userTookOverRef.current || Date.now() > deadline) {
        clearInterval(timer);
        return;
      }
      const max = node.scrollHeight - node.clientHeight;
      if (max > 0) node.scrollTop = max * pct;
    }, 100);
    return () => clearInterval(timer);
  }, [note]);

  // Any genuine input hands control back to the user immediately — this is what
  // distinguishes a real scroll from the programmatic re-pinning above.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const takeOver = () => { userTookOverRef.current = true; };
    const opts = { passive: true };
    for (const ev of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
      el.addEventListener(ev, takeOver, opts);
    return () => {
      for (const ev of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
        el.removeEventListener(ev, takeOver);
    };
  }, [slug]);

  const persist = useCallback((pct, status) => {
    api.put(`/notes/${encodeURIComponent(slug)}/progress`, { scrollPct: pct, status })
      .catch(() => { /* progress is best-effort; never interrupt reading */ });
  }, [slug]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !note || !restoredRef.current) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    setProgress(pct);

    // Debounce writes; a scroll gesture fires dozens of events per second.
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (Math.abs(pct - lastSaved.current) < 0.01) return;
      lastSaved.current = pct;
      // Reaching the end marks it read; anything else is "reading".
      persist(pct, pct > 0.97 ? 'read' : 'reading');
    }, 400);
  }, [note, persist]);

  // Flush the final position when leaving, so closing mid-note still resumes.
  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    const el = scrollRef.current;
    if (!el || !restoredRef.current) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    if (Math.abs(pct - lastSaved.current) >= 0.01) {
      persist(pct, pct > 0.97 ? 'read' : 'reading');
    }
  }, [persist]);

  const hue = note ? hueFor(note.domain) : t.accent.solid;

  return (
    <>
      {/* reading progress — the thin bar is the only chrome that tracks position */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, zIndex: Z.sticky,
        background: 'transparent', pointerEvents: 'none' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: hue,
          transition: 'width .1s linear' }} />
      </div>

      <Screen theme={t} scrollRef={scrollRef} onScroll={onScroll}
        padTop={STATUS_H + 2} padBottom={NAV_H + 24}>
        <div style={{ padding: `4px ${SCREEN_PAD_X}px 0` }}>
          <button onClick={onBack} className="forge-press" style={{ display: 'inline-flex', alignItems: 'center',
            gap: 6, background: 'none', border: 'none', color: t.text2, cursor: 'pointer',
            fontFamily: FONT, fontSize: 14.5, fontWeight: 550, padding: '6px 0', marginBottom: 4 }}>
            <Icon name="chevronLeft" size={19} /> Notes
          </button>
        </div>

        {err && (
          <div style={{ padding: `20px ${SCREEN_PAD_X}px` }}>
            <Card theme={t} style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Couldn't open note</div>
              <div style={{ fontSize: 13, color: t.text2 }}>{err}</div>
            </Card>
          </div>
        )}

        {!note && !err && (
          <div style={{ padding: `40px ${SCREEN_PAD_X}px`, color: t.text3, fontSize: 14 }}>Loading…</div>
        )}

        {note && (
          <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <Tag theme={t} color={hue}>{labelFor(note.domain)}</Tag>
              <span style={{ fontSize: 12.5, color: t.text3 }}>
                {readMins((note.body || '').length)} min read
              </span>
              {note.lastUpdated && <span style={{ fontSize: 12.5, color: t.text3 }}>
                · updated {fmtDate(note.lastUpdated)}</span>}
            </div>

            <Markdown source={note.body} theme={t} />

            {(note.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 26,
                paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
                {note.tags.map((tag) => (
                  <span key={tag} style={{ fontFamily: MONO, fontSize: 11, color: t.text3,
                    background: t.surface2, border: `1px solid ${t.border}`,
                    padding: '4px 9px', borderRadius: 7 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </Screen>
    </>
  );
}
