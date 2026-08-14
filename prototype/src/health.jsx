// health.jsx — shared Health-module chrome (header tabs + stat tile).
// The individual screens live in dashboard.jsx / nutrition.jsx / body.jsx / history.jsx.
import { Icon } from './icons.jsx';
import { Card } from './ui.jsx';
import { FONT, MONO, HUE, STATUS_H, ON_ACCENT, Z } from './theme.jsx';

export function ModuleHeader({ theme, nav, title, hue, view }) {
  const t = theme; const c = hue || HUE.health;
  const tabs = [
    { id: 'health', label: 'Dashboard' }, { id: 'nutrition', label: 'Nutrition' },
    { id: 'workouts', label: 'Workouts' }, { id: 'body', label: 'Body' }, { id: 'history', label: 'History' },
  ];
  return (
    <div style={{ paddingTop: STATUS_H, background: t.bg, position: 'sticky', top: 0, zIndex: Z.sticky,
      borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 10px' }}>
        <button onClick={() => nav.back()} style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          border: `1px solid ${t.border}`, background: t.surface, color: t.text, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronLeft" size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${c}, ${c}aa)` }}>
            <Icon name="heart" size={17} /></div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{title}</span>
        </div>
        <button onClick={() => nav.spotlight()} style={{ width: 40, height: 40, borderRadius: 12,
          border: `1px solid ${t.border}`, background: t.surface, color: t.text2, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="command" size={19} /></button>
      </div>
      <div style={{ display: 'flex', gap: 7, padding: '0 14px 10px', overflowX: 'auto' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => nav.deep(['health', tb.id === 'health' ? null : tb.id].filter(Boolean))}
            style={{ padding: '7px 14px', borderRadius: 100, whiteSpace: 'nowrap', cursor: 'pointer',
              fontFamily: FONT, fontSize: 13.5, fontWeight: view === tb.id ? 650 : 500,
              border: `1px solid ${view === tb.id ? c : t.border}`,
              background: view === tb.id ? c + '1f' : 'transparent', color: view === tb.id ? c : t.text2 }}>
            {tb.label}</button>
        ))}
      </div>
    </div>
  );
}

export function StatTile({ theme, icon, hue, label, value, unit, sub, onClick }) {
  const t = theme;
  return (
    <Card theme={t} onClick={onClick} style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: hue, background: hue + '1c' }}><Icon name={icon} size={16} /></div>
        <span style={{ fontSize: 12.5, color: t.text2, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{value}</span>
        {unit && <span style={{ fontSize: 12.5, color: t.text3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: t.text3, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}
