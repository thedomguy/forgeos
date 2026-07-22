// nav.jsx — Bottom navigation + Spotlight command palette (module switcher).
import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { Sheet, Tag } from './ui.jsx';
import { FONT, MONO, STATUS_H, HUE, ON_ACCENT, Z, SCREEN_PAD_X } from './theme.jsx';
import { MODULES, QUICK_ACTIONS } from './data.js';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'modules', label: 'Modules', icon: 'grid' },
  { id: 'assistant', label: 'Forge', icon: 'spark', center: true },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function BottomNav({ theme, active, onTab }) {
  const t = theme;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: Z.nav,
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))', pointerEvents: 'none' }}>
      <div style={{
        pointerEvents: 'auto', background: t.navBg, backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        padding: '10px 8px 6px',
      }}>
        {NAV_ITEMS.map(item => {
          const on = active === item.id;
          const c = on ? t.accent.solid : t.text3;
          if (item.center) {
            return (
              <button key={item.id} onClick={() => onTab(item.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0' }}>
                <div style={{ width: 46, height: 32, borderRadius: 16, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
                  background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
                  boxShadow: `0 6px 18px ${t.accent.glow}` }}>
                  <Icon name="spark" size={20} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: c, fontFamily: FONT }}>{item.label}</span>
              </button>
            );
          }
          return (
            <button key={item.id} onClick={() => onTab(item.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0',
              color: c, transition: 'color .15s' }}>
              <Icon name={item.icon} size={23} strokeWidth={on ? 2.1 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: on ? 650 : 500, fontFamily: FONT }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Spotlight: command palette across modules / screens / actions ──
export function Spotlight({ open, onClose, theme, nav }) {
  const t = theme;
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current && inputRef.current.focus(), 350); } }, [open]);

  const screens = [
    { id: 'home', name: 'Home', icon: 'home', hue: t.accent.solid, kind: 'Screen', go: () => nav.tab('home') },
    { id: 'timeline', name: 'Timeline', icon: 'timeline', hue: t.accent.solid, kind: 'Screen', go: () => nav.tab('timeline') },
    { id: 'profile', name: 'Profile', icon: 'user', hue: t.accent.solid, kind: 'Screen', go: () => nav.tab('profile') },
    { id: 'nutrition', name: 'Nutrition', icon: 'apple', hue: HUE.cal, kind: 'Health', go: () => nav.deep(['health','nutrition']) },
    { id: 'workouts', name: 'Workouts', icon: 'dumbbell', hue: HUE.workout, kind: 'Health', go: () => nav.deep(['health','workouts']) },
    { id: 'body', name: 'Body Metrics', icon: 'scale', hue: HUE.weight, kind: 'Health', go: () => nav.deep(['health','body']) },
    { id: 'history', name: 'Health History', icon: 'clock', hue: HUE.health, kind: 'Health', go: () => nav.deep(['health','history']) },
  ];
  const actions = QUICK_ACTIONS.map(a => ({ id: 'qa-' + a.id, name: a.label, icon: a.icon, hue: a.hue,
    kind: 'Action', go: () => nav.quick(a.id) }));
  const modules = MODULES.map(m => ({ id: 'mod-' + m.id, name: m.name + (m.installed ? '' : '  (soon)'), icon: m.icon,
    hue: m.hue, kind: 'Module', disabled: !m.installed,
    go: () => m.installed ? nav.deep(['health']) : null }));

  const all = [...modules, ...screens, ...actions];
  const ql = q.trim().toLowerCase();
  const filtered = ql ? all.filter(x => x.name.toLowerCase().includes(ql)) : all;
  const askActive = ql.length > 0;

  const grouped = {};
  filtered.forEach(x => { (grouped[x.kind] = grouped[x.kind] || []).push(x); });
  const order = ['Module', 'Health', 'Screen', 'Action'];

  const run = (x) => { if (x.disabled) return; onClose(); setTimeout(() => x.go && x.go(), 120); };

  return (
    <Sheet open={open} onClose={onClose} theme={t} full>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* search field */}
        <div style={{ padding: STATUS_H + 8 + 'px 16px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: `13px ${SCREEN_PAD_X}px`,
            background: t.surface2, borderRadius: 16, border: `1px solid ${t.border2}` }}>
            <Icon name="search" size={20} style={{ color: t.text3 }} />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search modules, screens, actions…" style={{ flex: 1, background: 'none',
              border: 'none', outline: 'none', color: t.text, fontSize: 16, fontFamily: FONT }} />
            <kbd style={{ fontFamily: MONO, fontSize: 11, color: t.text3, border: `1px solid ${t.border2}`,
              borderRadius: 6, padding: '2px 6px' }}>⌘K</kbd>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.text2,
            fontSize: 15, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Cancel</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${SCREEN_PAD_X}px 24px` }}>
          {/* Ask Forge row appears when typing */}
          {askActive && (
            <button onClick={() => { onClose(); setTimeout(() => nav.ask(q), 120); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
              borderRadius: 16, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
              background: `linear-gradient(135deg, ${t.accent.solid}1f, ${t.accent.solid}0a)`,
              border: `1px solid ${t.accent.solid}40` }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: ON_ACCENT,
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}>
                <Icon name="spark" size={20} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Ask Forge</div>
                <div style={{ fontSize: 13, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' }}>"{q}"</div>
              </div>
              <Icon name="arrowRight" size={18} style={{ color: t.accent.solid }} />
            </button>
          )}

          {order.filter(k => grouped[k]).map(k => (
            <div key={k} style={{ marginTop: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: 0.6,
                textTransform: 'uppercase', color: t.text3, padding: '12px 6px 8px' }}>
                {k === 'Health' ? 'Health Module' : k + 's'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grouped[k].map(x => (
                  <button key={x.id} onClick={() => run(x)} disabled={x.disabled} style={{
                    display: 'flex', alignItems: 'center', gap: 13, padding: '11px 10px', borderRadius: 13,
                    background: 'none', border: 'none', cursor: x.disabled ? 'default' : 'pointer',
                    opacity: x.disabled ? 0.4 : 1, textAlign: 'left', width: '100%', transition: 'background .12s',
                    color: t.text }}
                    onMouseEnter={e => !x.disabled && (e.currentTarget.style.background = t.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: x.hue, background: x.hue + '1c' }}>
                      <Icon name={x.icon} size={19} /></div>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 530 }}>{x.name}</span>
                    {x.disabled ? <Tag theme={t} color={t.text3}>soon</Tag>
                      : <Icon name="arrowUp" size={15} style={{ color: t.text3, transform: 'rotate(45deg)' }} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !askActive && (
            <div style={{ textAlign: 'center', color: t.text3, padding: 40, fontSize: 14 }}>No matches</div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
