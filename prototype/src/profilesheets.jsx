// profilesheets.jsx — Profile detail/edit sheets (bound to the store).
// Rendered by ProfileScreen; a single Sheet whose content switches on `which`.
import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Sheet, Button } from './ui.jsx';
import { FONT, MONO, HUE, ON_ACCENT } from './theme.jsx';
import { useStore, useSettings, useAuth } from './store.jsx';

const STORE_KEY = 'forge_state_v1';
const UNITS = ['Metric', 'Imperial'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const AI_TONES = ['Concise', 'Balanced', 'Detailed'];

// ── small primitives ────────────────────────────────────────────
function SheetHead({ theme, title, sub }) {
  return (
    <div style={{ padding: '12px 0 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: theme.text2, marginTop: 5, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function Toggle({ on, onClick, theme }) {
  const t = theme;
  return (
    <button onClick={onClick} role="switch" aria-checked={on} style={{
      position: 'relative', width: 46, height: 27, borderRadius: 100, border: 'none', cursor: 'pointer',
      background: on ? t.accent.solid : t.track, transition: 'background .15s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2.5, left: on ? 21 : 2.5, width: 22, height: 22,
        borderRadius: '50%', background: ON_ACCENT, boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        transition: 'left .15s' }} />
    </button>
  );
}

function ToggleRow({ label, sub, on, onClick, theme, first }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
      borderTop: first ? 'none' : `1px solid ${t.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 550 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.text3, marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onClick={onClick} theme={t} />
    </div>
  );
}

function Segmented({ options, value, onChange, theme }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', gap: 5, background: t.surface2, padding: 4, borderRadius: 12,
      border: `1px solid ${t.border}` }}>
      {options.map(o => {
        const on = o === value;
        return (
          <button key={o} onClick={() => onChange(o)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
            background: on ? t.accent.solid : 'transparent',
            color: on ? ON_ACCENT : t.text2, transition: 'all .15s' }}>{o}</button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, unit, onChange, theme, step = 1 }) {
  const t = theme;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: t.text2, marginBottom: 7 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
        background: t.surface2, border: `1px solid ${t.border2}` }}>
        <input type="number" inputMode="decimal" value={value} step={step}
          onChange={e => onChange(e.target.value)} style={{ flex: 1, background: 'none', border: 'none',
          outline: 'none', color: t.text, fontSize: 17, fontFamily: MONO, fontWeight: 600, minWidth: 0 }} />
        {unit && <span style={{ fontSize: 13, color: t.text3 }}>{unit}</span>}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, theme, type = 'text', placeholder }) {
  const t = theme;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: t.text2, marginBottom: 7 }}>{label}</div>
      <div style={{ padding: '12px 14px', borderRadius: 14, background: t.surface2,
        border: `1px solid ${t.border2}` }}>
        <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: t.text,
          fontSize: 15, fontFamily: FONT }} />
      </div>
    </div>
  );
}

function LabeledField({ theme, label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: theme.text2, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────
export function ProfileSheets({ which, onClose, onNavigate, theme, nav }) {
  const t = theme;
  const store = useStore();
  const { goals, preferences, notifications } = useSettings();
  const auth = useAuth();

  // keep last-open key so content stays put during the close animation
  const [active, setActive] = useState(which);
  const [goalDraft, setGoalDraft] = useState({ ...goals });
  const [personal, setPersonal] = useState({ name: '', email: '' });

  useEffect(() => {
    if (!which) return;
    setActive(which);
    if (which === 'goals') setGoalDraft({ weight: goals.weight, protein: goals.protein, calories: goals.calories });
    if (which === 'personal') setPersonal({
      name: preferences.name || auth.name || '',
      email: preferences.email || auth.email || '',
    });
  }, [which]);

  const saveGoals = () => {
    store.updateGoals({
      weight: parseFloat(goalDraft.weight) || goals.weight,
      protein: Math.round(parseFloat(goalDraft.protein)) || goals.protein,
      calories: Math.round(parseFloat(goalDraft.calories)) || goals.calories,
    });
    onClose(); nav.toast('Goals updated');
  };
  const savePersonal = () => {
    store.updatePreferences({ name: personal.name.trim(), email: personal.email.trim() });
    onClose(); nav.toast('Profile updated');
  };
  const exportData = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY) || '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'forge-data.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      nav.toast('Exported forge-data.json');
    } catch { nav.toast('Export is not available here'); }
  };

  const content = () => {
    switch (active) {
      case 'personal':
        return (
          <>
            <SheetHead theme={t} title="Personal Info" sub="How Forge addresses you across the OS." />
            <TextField theme={t} label="Name" value={personal.name}
              onChange={v => setPersonal(p => ({ ...p, name: v }))} placeholder="Your name" />
            <TextField theme={t} label="Email" type="email" value={personal.email}
              onChange={v => setPersonal(p => ({ ...p, email: v }))} placeholder="you@forge.os" />
            <div style={{ marginTop: 8 }}><Button theme={t} onClick={savePersonal}>Save changes</Button></div>
          </>
        );

      case 'goals':
        return (
          <>
            <SheetHead theme={t} title="Goals" sub="Targets your dashboard and insights track against." />
            <NumberField theme={t} label="Target weight" unit="kg" step={0.1}
              value={goalDraft.weight} onChange={v => setGoalDraft(g => ({ ...g, weight: v }))} />
            <NumberField theme={t} label="Daily protein" unit="g"
              value={goalDraft.protein} onChange={v => setGoalDraft(g => ({ ...g, protein: v }))} />
            <NumberField theme={t} label="Daily calories" unit="kcal"
              value={goalDraft.calories} onChange={v => setGoalDraft(g => ({ ...g, calories: v }))} />
            <div style={{ marginTop: 8 }}><Button theme={t} onClick={saveGoals}>Save goals</Button></div>
          </>
        );

      case 'preferences':
        return (
          <>
            <SheetHead theme={t} title="Preferences" sub="Units and currency used throughout Forge." />
            <LabeledField theme={t} label="Units">
              <Segmented theme={t} options={UNITS} value={preferences.units}
                onChange={v => store.updatePreferences({ units: v })} />
            </LabeledField>
            <LabeledField theme={t} label="Currency">
              <Segmented theme={t} options={CURRENCIES} value={preferences.currency}
                onChange={v => store.updatePreferences({ currency: v })} />
            </LabeledField>
            <div style={{ fontSize: 12.5, color: t.text3, lineHeight: 1.5, marginTop: 4 }}>
              Changes are saved instantly.</div>
          </>
        );

      case 'notifications': {
        const rows = [
          { key: 'workouts', label: 'Workout reminders', sub: 'Nudges before your scheduled sessions' },
          { key: 'meals', label: 'Meal logging', sub: 'Reminders to log what you eat' },
          { key: 'insights', label: 'AI insights', sub: 'Weekly patterns, wins and progress' },
          { key: 'water', label: 'Hydration', sub: 'Gentle water-intake nudges' },
        ];
        return (
          <>
            <SheetHead theme={t} title="Notifications" sub="Choose what Forge can reach out about." />
            <div>
              {rows.map((r, i) => (
                <ToggleRow key={r.key} theme={t} first={i === 0} label={r.label} sub={r.sub}
                  on={!!notifications[r.key]} onClick={() => store.toggleSetting(r.key)} />
              ))}
            </div>
          </>
        );
      }

      case 'ai':
        return (
          <>
            <SheetHead theme={t} title="AI Preferences"
              sub="How the Forge assistant behaves when it answers you." />
            <LabeledField theme={t} label="Answer style">
              <Segmented theme={t} options={AI_TONES} value={preferences.aiTone || 'Balanced'}
                onChange={v => store.updatePreferences({ aiTone: v })} />
            </LabeledField>
            <div>
              <ToggleRow theme={t} first label="Proactive insights"
                sub="Surface patterns without being asked"
                on={!!notifications.insights} onClick={() => store.toggleSetting('insights')} />
            </div>
            <div style={{ fontSize: 12.5, color: t.text3, lineHeight: 1.55, marginTop: 14 }}>
              The assistant retrieves across every installed module. Deeper controls (memory, custom
              sources) arrive with cloud sync.</div>
          </>
        );

      case 'services': {
        const services = [
          { name: 'Apple Health', icon: 'heart', hue: HUE.cal, status: 'Connected' },
          { name: 'Google Fit', icon: 'flame', hue: HUE.burn, status: 'Connected' },
          { name: 'Strava', icon: 'route', hue: HUE.workout, status: 'Connected' },
        ];
        return (
          <>
            <SheetHead theme={t} title="Connected Services" sub="Sources syncing into your Health module." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13,
                  borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: s.hue, background: s.hue + '1c' }}>
                    <Icon name={s.icon} size={18} /></div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 550 }}>{s.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5,
                    fontWeight: 600, color: HUE.health }}>
                    <span style={{ width: 7, height: 7, borderRadius: 7, background: HUE.health }} />{s.status}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Button theme={t} kind="ghost" icon="plus"
                onClick={() => nav.toast('More integrations arrive with cloud sync')}>Connect a service</Button>
            </div>
            <div style={{ fontSize: 12, color: t.text3, lineHeight: 1.5, marginTop: 12, textAlign: 'center' }}>
              Connections are simulated in this prototype.</div>
          </>
        );
      }

      case 'privacy':
        return (
          <>
            <SheetHead theme={t} title="Privacy & Data"
              sub="Your Forge data lives on this device only." />
            <div style={{ padding: 14, borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}`,
              fontSize: 13, color: t.text2, lineHeight: 1.55, marginBottom: 14 }}>
              Nothing leaves your browser. Everything you log is stored locally and never sent to a server
              in this prototype.</div>
            <Button theme={t} kind="ghost" icon="doc" onClick={exportData}>Export my data (JSON)</Button>
            <div style={{ marginTop: 10 }}>
              <Button theme={t} kind="danger" icon="refresh"
                onClick={() => onNavigate('reset')}>
                Reset demo data</Button>
            </div>
          </>
        );

      case 'reset':
        return (
          <>
            <SheetHead theme={t} title="Reset demo data?"
              sub="This restores all modules, timeline, meals and settings to their original demo state. You stay signed in." />
            <Button theme={t} kind="danger"
              onClick={() => { store.resetDemo(); onClose(); nav.toast('Demo data reset'); }}>Reset everything</Button>
            <div style={{ marginTop: 10 }}>
              <Button theme={t} kind="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={!!which} onClose={onClose} theme={t}>
      <div style={{ padding: '4px 20px 34px', overflowY: 'auto' }}>{content()}</div>
    </Sheet>
  );
}
