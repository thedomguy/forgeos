// screens.jsx — OS shell screens: Home, Modules, Timeline, Profile.
import { Fragment, useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Screen, Card, Chip, IconBtn, Ring, Tag, Avatar, Sheet, Button } from './ui.jsx';
import { FONT, MONO, HUE, ACCENTS, ON_ACCENT, Z, SCREEN_PAD_X } from './theme.jsx';
import { MODULES, QUICK_ACTIONS } from './data.js';
import { useToday, useTimeline, useInsights, useStore, useSettings, useAuth } from './store.jsx';
import { ProfileSheets } from './profilesheets.jsx';
import { ProfileMenu } from './profilemenu.jsx';

const moduleName = (id) => (MODULES.find(m => m.id === id) || {}).name || id;

// shared big header with optional spotlight/command button
export function ScreenHeader({ theme, title, sub, nav, trailing, onCommand = true }) {
  const t = theme;
  return (
    <div style={{ padding: '6px 20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {sub && <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0.5, color: t.text3,
            textTransform: 'uppercase', marginBottom: 6 }}>{sub}</div>}
          <div style={{ fontSize: 30, fontWeight: 680, letterSpacing: -0.6, lineHeight: 1.05 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', gap: 9, flexShrink: 0, paddingTop: 2 }}>
          {trailing}
          {onCommand && nav && <button onClick={() => nav.spotlight()} style={{ width: 42, height: 42,
            borderRadius: 13, border: `1px solid ${t.border}`, background: t.surface, color: t.text2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="command" size={19} /></button>}
        </div>
      </div>
    </div>
  );
}

export function SectionLabel({ theme, children, action, onAction }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 22px 10px' }}>
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, letterSpacing: 0.6,
        textTransform: 'uppercase', color: t.text3 }}>{children}</span>
      {action && <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: t.accent.solid, fontSize: 13.5, fontWeight: 600, fontFamily: FONT,
        display: 'flex', alignItems: 'center', gap: 3 }}>{action}<Icon name="chevronRight" size={14} /></button>}
    </div>
  );
}

const WEEKDAY_DATE = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

// ── shared: timeline event detail sheet (used by Home + Timeline) ─
function EventDetailSheet({ event, theme, onClose, nav }) {
  const t = theme;
  return (
    <Sheet open={!!event} onClose={onClose} theme={t}>
      {event && (
        <div style={{ padding: '8px 20px 34px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 16px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: event.hue, background: event.hue + '1c' }}>
              <Icon name={event.icon} size={26} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tag theme={t} color={event.hue}>{event.tag}</Tag>
              <div style={{ fontSize: 18, fontWeight: 680, marginTop: 7 }}>{event.title}</div>
            </div>
          </div>
          <div style={{ fontSize: 14.5, color: t.text2, lineHeight: 1.5 }}>{event.sub}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {[['Time', event.t], ['Module', moduleName(event.module)]].map(([l, v]) => (
              <div key={l} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: t.surface2,
                border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11.5, color: t.text3 }}>{l}</div>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Button theme={t} kind="ghost" icon="timeline"
              onClick={() => { onClose(); nav.tab('timeline'); }}>View in Timeline</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── shared: simulated module install flow ────────────────────────
function InstallSheet({ module, theme, onClose, nav }) {
  const t = theme;
  const [phase, setPhase] = useState('install'); // 'install' | 'done'
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!module) return;
    setPhase('install'); setPct(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 9;
      if (p >= 100) { p = 100; setPct(100); clearInterval(iv); setTimeout(() => setPhase('done'), 380); }
      else setPct(p);
    }, 300);
    return () => clearInterval(iv);
  }, [module]);

  return (
    <Sheet open={!!module} onClose={onClose} theme={t}>
      {module && (
        <div style={{ padding: '10px 22px 34px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 66, height: 66, borderRadius: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: ON_ACCENT, marginBottom: 16,
              background: `linear-gradient(135deg, ${module.hue}, ${module.hue}aa)`,
              boxShadow: `0 10px 26px ${module.hue}55` }}>
              <Icon name={phase === 'done' ? 'check' : module.icon} size={32}
                strokeWidth={phase === 'done' ? 2.6 : 2} /></div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{module.name}</div>
            <div style={{ fontSize: 13.5, color: t.text2, marginTop: 4 }}>{module.tagline}</div>
          </div>

          {phase === 'install' ? (
            <div style={{ marginTop: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.text2 }}>
                  {pct < 40 ? 'Preparing module…' : pct < 82 ? 'Installing…' : 'Finishing up…'}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: module.hue }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 100, background: t.track, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', borderRadius: 100, background: module.hue,
                  transition: 'width .3s' }} />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <div style={{ padding: 16, borderRadius: 16, background: t.surface2, border: `1px solid ${t.border}`,
                textAlign: 'center' }}>
                <div style={{ fontSize: 15.5, fontWeight: 650, marginBottom: 5 }}>Coming soon — you're on the list</div>
                <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.5 }}>
                  {module.name} isn't live yet. We'll notify you the moment it plugs into your timeline,
                  assistant, and dashboard.</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Button theme={t} onClick={() => { onClose(); nav.toast(`We'll let you know when ${module.name} is ready`); }}>
                  Notify me</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ── HOME ────────────────────────────────────────────────────────
export function HomeScreen({ theme, nav }) {
  const t = theme;
  const today = useToday();
  const timeline = useTimeline();
  const insights = useInsights();
  const [detail, setDetail] = useState(null);

  const inPct = Math.round((today.caloriesIn / today.caloriesGoal) * 100);
  const net = today.caloriesIn - today.caloriesOut;
  const insight = insights[2] || insights[0] || {};
  const recent = timeline.slice(0, 3);

  // Greet the actual signed-in user by first name, at the right time of day —
  // the hardcoded "Good evening, Alex" was a mock-data leftover.
  const store = useStore();
  const auth = useAuth();
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const firstName = (auth?.name || '').trim().split(/\s+/)[0];
  const greeting = `Good ${partOfDay}${firstName ? `, ${firstName}` : ''}`;

  return (
    <Screen theme={t}>
      <ScreenHeader theme={t} nav={nav} sub={WEEKDAY_DATE} title={greeting}
        trailing={<ProfileMenu theme={t} user={auth} onLogout={store.logout} onToast={nav.toast} />} />

      {/* Today hero */}
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} elevated style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: 0.5, color: t.text3,
                textTransform: 'uppercase' }}>Today's Energy</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>{net.toLocaleString()}</span>
                <span style={{ fontSize: 14, color: t.text2, fontWeight: 500 }}>net kcal</span>
              </div>
            </div>
            <Ring theme={t} value={today.caloriesIn} max={today.caloriesGoal} size={84} stroke={9}
              gradient={[HUE.cal, HUE.calLight]}>
              <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600 }}>{inPct}%</span>
              <span style={{ fontSize: 10, color: t.text3, marginTop: 1 }}>of goal</span>
            </Ring>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {[['Eaten', today.caloriesIn, HUE.cal], ['Burned', today.caloriesOut, HUE.burn],
              ['Remaining', Math.max(0, today.caloriesGoal - today.caloriesIn), t.text2]].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: t.text3, marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: c }}>{v.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <SectionLabel theme={t}>Quick Actions</SectionLabel>
      <div style={{ display: 'flex', gap: 10, padding: `0 ${SCREEN_PAD_X}px`, overflowX: 'auto' }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.id} onClick={() => nav.quick(a.id)} style={{ flex: '1 0 0', minWidth: 78,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '15px 8px',
            borderRadius: 18, cursor: 'pointer', background: t.surface, border: `1px solid ${t.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: a.hue, background: a.hue + '1c' }}><Icon name={a.icon} size={21} /></div>
            <span style={{ fontSize: 12, fontWeight: 550, color: t.text, textAlign: 'center' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Module summaries */}
      <SectionLabel theme={t} action="All modules" onAction={() => nav.tab('modules')}>Modules</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: `0 ${SCREEN_PAD_X}px` }}>
        {MODULES.slice(0, 4).map(m => (
          <Card key={m.id} theme={t} onClick={() => m.installed ? nav.deep(['health']) : nav.tab('modules')}
            style={{ padding: 15, opacity: m.installed ? 1 : 0.62 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: m.hue, background: m.hue + '1c' }}><Icon name={m.icon} size={19} /></div>
              {!m.installed && <Tag theme={t} color={t.text3}>soon</Tag>}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 620 }}>{m.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: m.hue }}>{m.stat}</span>
              <span style={{ fontSize: 11.5, color: t.text3 }}>{m.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* AI insight */}
      <SectionLabel theme={t} action="Ask Forge" onAction={() => nav.tab('assistant')}>AI Insight</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} onClick={() => nav.tab('assistant')} style={{ padding: 16,
          background: `linear-gradient(135deg, ${t.accent.solid}14, ${t.surface} 60%)`,
          border: `1px solid ${t.accent.solid}33` }}>
          <div style={{ display: 'flex', gap: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
              background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}>
              <Icon name="spark" size={20} /></div>
            <div>
              <div style={{ fontWeight: 620, fontSize: 14.5, marginBottom: 3 }}>{insight.title}</div>
              <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.45 }}>{insight.body}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <SectionLabel theme={t} action="Timeline" onAction={() => nav.tab('timeline')}>Recent Activity</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: '4px 0' }}>
          {recent.map((e, i) => (
            <div key={e.id} onClick={() => setDetail(e)} style={{ display: 'flex', alignItems: 'center', gap: 13,
              padding: `12px ${SCREEN_PAD_X}px`, cursor: 'pointer',
              borderTop: i ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: e.hue, background: e.hue + '1c' }}><Icon name={e.icon} size={17} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 560 }}>{e.title}</div>
                <div style={{ fontSize: 12.5, color: t.text3, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' }}>{e.sub}</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 12, color: t.text3 }}>{e.t}</span>
            </div>
          ))}
        </Card>
      </div>

      <EventDetailSheet event={detail} theme={t} onClose={() => setDetail(null)} nav={nav} />
    </Screen>
  );
}

// ── MODULES ─────────────────────────────────────────────────────
export function ModulesScreen({ theme, nav }) {
  const t = theme;
  const [install, setInstall] = useState(null);
  const installed = MODULES.filter(m => m.installed);
  const future = MODULES.filter(m => !m.installed);
  return (
    <Screen theme={t}>
      <ScreenHeader theme={t} nav={nav} sub="Your operating system" title="Modules" />
      <SectionLabel theme={t}>Installed</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {installed.map(m => (
          <Card key={m.id} theme={t} elevated
            onClick={() => (m.id === 'learning' ? nav.knowledge() : nav.deep(['health']))} style={{ padding: 16,
            background: `linear-gradient(120deg, ${m.hue}14, ${t.surface} 55%)`, border: `1px solid ${m.hue}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${m.hue}, ${m.hue}aa)`,
                boxShadow: `0 8px 20px ${m.hue}40` }}><Icon name={m.icon} size={25} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 680 }}>{m.name}</div>
                <div style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }}>{m.tagline}</div>
              </div>
              <Icon name="chevronRight" size={20} style={{ color: t.text3 }} />
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel theme={t}>Available to Add</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: `0 ${SCREEN_PAD_X}px` }}>
        {future.map(m => (
          <Card key={m.id} theme={t} onClick={() => setInstall(m)} style={{ padding: 15 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: m.hue, background: m.hue + '18', marginBottom: 12 }}>
              <Icon name={m.icon} size={21} /></div>
            <div style={{ fontSize: 14.5, fontWeight: 620 }}>{m.name}</div>
            <div style={{ fontSize: 11.5, color: t.text3, marginTop: 3, lineHeight: 1.35,
              minHeight: 30 }}>{m.tagline}</div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, color: m.hue,
              fontSize: 12.5, fontWeight: 600 }}><Icon name="plus" size={15} />Add module</div>
          </Card>
        ))}
      </div>
      <div style={{ padding: '22px 22px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, color: t.text3, lineHeight: 1.5 }}>
          Forge is modular by design — every new module plugs into the same timeline, assistant, and dashboard.</span>
      </div>

      <InstallSheet module={install} theme={t} onClose={() => setInstall(null)} nav={nav} />
    </Screen>
  );
}

// ── TIMELINE ────────────────────────────────────────────────────
export function TimelineScreen({ theme, nav }) {
  const t = theme;
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState(null);
  const filters = [
    { id: 'all', label: 'All' }, { id: 'health', label: 'Health' },
    { id: 'finance', label: 'Finance' }, { id: 'learning', label: 'Learning' },
  ];
  const all = useTimeline(filter);
  const q = query.trim().toLowerCase();
  const items = q ? all.filter(e => `${e.title} ${e.sub} ${e.tag}`.toLowerCase().includes(q)) : all;

  return (
    <Screen theme={t}>
      <ScreenHeader theme={t} nav={nav} sub={WEEKDAY_DATE} title="Timeline"
        trailing={<IconBtn name={searchOpen ? 'close' : 'search'} theme={t} size={42} active={searchOpen}
          onClick={() => { setSearchOpen(o => { if (o) setQuery(''); return !o; }); }} />} />

      {searchOpen && (
        <div style={{ padding: `0 ${SCREEN_PAD_X}px 10px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `11px ${SCREEN_PAD_X}px`,
            background: t.surface2, borderRadius: 14, border: `1px solid ${t.border2}` }}>
            <Icon name="search" size={18} style={{ color: t.text3 }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search your timeline…" style={{ flex: 1, background: 'none', border: 'none',
              outline: 'none', color: t.text, fontSize: 15, fontFamily: FONT }} />
            {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: t.text3, display: 'flex' }}><Icon name="close" size={16} /></button>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: `0 ${SCREEN_PAD_X}px 6px`, overflowX: 'auto' }}>
        {filters.map(f => <Chip key={f.id} theme={t} active={filter === f.id}
          onClick={() => setFilter(f.id)}>{f.label}</Chip>)}
      </div>

      <div style={{ padding: `14px ${SCREEN_PAD_X}px 0` }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: t.text3, padding: '36px 0', fontSize: 14 }}>
            {q ? 'No matching events' : 'No activity yet'}</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 38 }}>
            {/* vertical line */}
            <div style={{ position: 'absolute', left: 17, top: 6, bottom: 6, width: 2,
              background: t.border2 }} />
            {items.map((e) => (
              <div key={e.id} style={{ position: 'relative', marginBottom: 14 }}>
                <div style={{ position: 'absolute', left: -38, top: 6, width: 36, height: 36, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: e.hue,
                  background: e.hue + '1c', border: `3px solid ${t.bg}`, zIndex: Z.base }}>
                  <Icon name={e.icon} size={17} /></div>
                <Card theme={t} accent={e.accentRow ? e.hue : null} onClick={() => setDetail(e)}
                  style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Tag theme={t} color={e.hue}>{e.tag}</Tag>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: t.text3 }}>{e.t}</span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 7 }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: t.text2, marginTop: 2 }}>{e.sub}</div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventDetailSheet event={detail} theme={t} onClose={() => setDetail(null)} nav={nav} />
    </Screen>
  );
}

// ── PROFILE ─────────────────────────────────────────────────────
export function ProfileScreen({ theme, nav, dark, setDark, accentKey, setAccentKey }) {
  const t = theme;
  const store = useStore();
  const { goals, preferences, notifications } = useSettings();
  const auth = useAuth();
  const [sheet, setSheet] = useState(null);

  const displayName = preferences.name || auth.name || 'Alex Morgan';
  const displayEmail = preferences.email || auth.email || 'alex@forge.os';
  const notifOn = Object.values(notifications).filter(Boolean).length;

  const groups = [
    { label: 'Account', rows: [
      { key: 'personal', icon: 'user', c: t.accent.solid, name: 'Personal Info', detail: displayName },
      { key: 'goals', icon: 'target', c: HUE.health, name: 'Goals',
        detail: `${goals.weight} kg · ${goals.protein}g protein` },
      { key: 'preferences', icon: 'sliders', c: HUE.water, name: 'Preferences',
        detail: `${preferences.units} · ${preferences.currency}` },
    ]},
    { label: 'Forge', rows: [
      { key: 'ai', icon: 'spark', c: t.accent.solid, name: 'AI Preferences',
        detail: notifications.insights ? 'Proactive' : 'Manual' },
      { key: 'services', icon: 'link', c: HUE.travel, name: 'Connected Services', detail: '3 active' },
      { key: 'notifications', icon: 'bell', c: HUE.finance, name: 'Notifications', detail: `${notifOn} on` },
      { key: 'privacy', icon: 'shield', c: HUE.health, name: 'Privacy & Data' },
    ]},
  ];

  return (
    <Screen theme={t}>
      <ScreenHeader theme={t} nav={nav} sub="Your account" title="Profile" onCommand={false}
        trailing={<IconBtn name="settings" theme={t} size={42} onClick={() => setSheet('preferences')} />} />
      {/* identity card */}
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} elevated style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar theme={t} size={60} ring name={displayName} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 13, color: t.text2, marginTop: 2, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
              <Tag theme={t} color={t.accent.solid}>Forge Pro</Tag>
              <Tag theme={t} color={HUE.cal}>148-day streak</Tag>
            </div>
          </div>
        </Card>
      </div>
      {/* lifetime stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: `14px ${SCREEN_PAD_X}px 0` }}>
        {[['Days active', '148'], ['Workouts', '92'], ['Entries', '2.1k']].map(([l, v]) => (
          <Card key={l} theme={t} style={{ padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: t.accent.solid }}>{v}</div>
            <div style={{ fontSize: 11.5, color: t.text3, marginTop: 3 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* appearance — real settings (dark mode + accent), replacing the design-tool's Tweaks panel */}
      <SectionLabel theme={t}>Appearance</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 550 }}>Dark mode</span>
            <button onClick={() => setDark(!dark)} role="switch" aria-checked={dark} style={{
              position: 'relative', width: 46, height: 27, borderRadius: 100, border: 'none', cursor: 'pointer',
              background: dark ? t.accent.solid : t.track, transition: 'background .15s' }}>
              <span style={{ position: 'absolute', top: 2.5, left: dark ? 21 : 2.5, width: 22, height: 22,
                borderRadius: '50%', background: ON_ACCENT, boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                transition: 'left .15s' }} />
            </button>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 550, marginBottom: 10 }}>Accent color</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.keys(ACCENTS).map(key => (
                <button key={key} onClick={() => setAccentKey(key)} aria-label={key} style={{
                  width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${ACCENTS[key].g1}, ${ACCENTS[key].g2})`,
                  border: accentKey === key ? `2px solid ${t.text}` : '2px solid transparent',
                  boxShadow: accentKey === key ? `0 0 0 3px ${t.bg}, 0 0 0 4px ${ACCENTS[key].solid}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {accentKey === key && <Icon name="check" size={16} style={{ color: ON_ACCENT }} strokeWidth={2.6} />}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {groups.map(g => (
        <Fragment key={g.label}>
          <SectionLabel theme={t}>{g.label}</SectionLabel>
          <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
            <Card theme={t} style={{ padding: '4px 0' }}>
              {g.rows.map((r, i) => (
                <div key={r.name} onClick={() => setSheet(r.key)} style={{ display: 'flex', alignItems: 'center',
                  gap: 13, padding: `13px ${SCREEN_PAD_X}px`, cursor: 'pointer',
                  borderTop: i ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: r.c, background: r.c + '1c' }}><Icon name={r.icon} size={17} /></div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 530 }}>{r.name}</span>
                  {r.detail && <span style={{ fontSize: 13, color: t.text3 }}>{r.detail}</span>}
                  <Icon name="chevronRight" size={17} style={{ color: t.text3 }} />
                </div>
              ))}
            </Card>
          </div>
        </Fragment>
      ))}

      {/* Account actions */}
      <div style={{ padding: `24px ${SCREEN_PAD_X}px 8px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button theme={t} kind="ghost" icon="refresh" onClick={() => setSheet('reset')}>Reset demo data</Button>
        <Button theme={t} kind="danger" icon="arrowRight" onClick={() => store.logout()}>Log out</Button>
      </div>
      <div style={{ textAlign: 'center', padding: '4px 20px 4px' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>Forge OS · Prototype</span>
      </div>

      <ProfileSheets which={sheet} onClose={() => setSheet(null)} onNavigate={setSheet}
        theme={t} nav={nav} />
    </Screen>
  );
}
