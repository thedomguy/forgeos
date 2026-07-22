// App.jsx — Forge OS root: navigation, stores, sheets, toast.
import { useState, useCallback, useEffect, useRef } from 'react';
import { makeTheme, AppShell } from './theme.jsx';
import { BottomNav, Spotlight } from './nav.jsx';
import { HomeScreen, ModulesScreen, TimelineScreen, ProfileScreen } from './screens.jsx';
import { HealthDashboard, NutritionScreen, BodyScreen, HistoryScreen } from './health.jsx';
import { AssistantScreen } from './assistant.jsx';
import { WorkoutsScreen, WorkoutLive, WorkoutBanner, elapsedOf } from './workout.jsx';
import { AddFoodSheet, LogWeightSheet } from './sheets.jsx';
import { WORKOUT_TEMPLATES, PUSH_EXERCISES } from './data.js';
import { NAV_H, FONT, ON_ACCENT, SCRIM, Z } from './theme.jsx';

const TAB_OF = { home: 'home', modules: 'modules', assistant: 'assistant', timeline: 'timeline', profile: 'profile' };

function readStored(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function deepCopyTemplate(tplId) {
  const tpl = WORKOUT_TEMPLATES.find(w => w.id === tplId) || WORKOUT_TEMPLATES[0];
  // only Push has real exercise data; reuse for any template in this prototype
  return {
    active: true, name: tpl.name, startedAt: Date.now(), paused: false, pausedAt: 0, pausedTotal: 0,
    exercises: PUSH_EXERCISES.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, done: false })) })),
  };
}

export default function App() {
  const [dark, setDark] = useState(() => readStored('forge_dark', true));
  const [accentKey, setAccentKey] = useState(() => readStored('forge_accent', 'violet'));
  useEffect(() => { try { localStorage.setItem('forge_dark', JSON.stringify(dark)); } catch {} }, [dark]);
  useEffect(() => { try { localStorage.setItem('forge_accent', JSON.stringify(accentKey)); } catch {} }, [accentKey]);
  const theme = makeTheme(dark, accentKey);

  const [stack, setStack] = useState([{ view: 'home', tab: 'home' }]);
  const [seed, setSeed] = useState(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // workout store (persisted)
  const [workout, setWorkout] = useState(() => readStored('forge_workout', null));
  useEffect(() => {
    try { workout ? localStorage.setItem('forge_workout', JSON.stringify(workout))
      : localStorage.removeItem('forge_workout'); } catch {}
  }, [workout]);

  const top = stack[stack.length - 1];
  const activeTab = top.tab;

  const showToast = useCallback((msg) => {
    setToast(msg); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const nav = {
    tab: (view) => { setSpotlightOpen(false); setStack([{ view, tab: TAB_OF[view] || view }]); },
    deep: (arr) => { setSpotlightOpen(false);
      const frames = [{ view: 'health', tab: 'modules' }];
      arr.slice(1).forEach(v => frames.push({ view: v, tab: 'modules' }));
      setStack(frames);
    },
    back: () => setStack(s => s.length > 1 ? s.slice(0, -1) : [{ view: 'home', tab: 'home' }]),
    spotlight: () => setSpotlightOpen(true),
    ask: (q) => { setSpotlightOpen(false); setStack([{ view: 'assistant', tab: 'assistant' }]); setSeed(q); },
    toast: showToast,
    quick: (id) => {
      setSpotlightOpen(false);
      if (id === 'food') setFoodOpen(true);
      else if (id === 'weight') setWeightOpen(true);
      else if (id === 'workout') nav.startWorkout('push');
      else if (id === 'walk') showToast('Activity tracking started — GPS live');
      else if (id === 'water') showToast('+250 ml water logged');
    },
    startWorkout: (tplId) => {
      setSpotlightOpen(false);
      setWorkout(deepCopyTemplate(tplId));
      setStack([{ view: 'health', tab: 'modules' }, { view: 'workout-live', tab: 'modules' }]);
    },
    openWorkout: () => setStack(s => s[s.length-1].view === 'workout-live' ? s
      : [...s.filter(f => f.view !== 'workout-live'), { view: 'workout-live', tab: 'modules' }]),
    minimizeWorkout: () => setStack(s => s.filter(f => f.view !== 'workout-live').length
      ? s.filter(f => f.view !== 'workout-live') : [{ view: 'health', tab: 'modules' }]),
  };

  const workoutApi = {
    toggleSet: (ei, si) => setWorkout(w => { const c = structuredClone(w);
      c.exercises[ei].sets[si].done = !c.exercises[ei].sets[si].done; return c; }),
    addSet: (ei) => setWorkout(w => { const c = structuredClone(w);
      const last = c.exercises[ei].sets[c.exercises[ei].sets.length - 1];
      c.exercises[ei].sets.push({ w: last ? last.w : 20, reps: last ? last.reps : 10, prev: '—', done: false });
      return c; }),
    pause: () => setWorkout(w => ({ ...w, paused: true, pausedAt: Date.now() })),
    resume: () => setWorkout(w => ({ ...w, paused: false, pausedTotal: (w.pausedTotal||0) + (Date.now() - w.pausedAt) })),
    finish: () => {
      const mins = Math.round(elapsedOf(workout) / 60000);
      setWorkout(null);
      setStack([{ view: 'health', tab: 'modules' }]);
      showToast(`Workout saved · ${mins || 1} min logged to timeline`);
    },
  };

  // render the current frame
  const renderFrame = () => {
    const v = top.view;
    if (v === 'home') return <HomeScreen theme={theme} nav={nav} />;
    if (v === 'modules') return <ModulesScreen theme={theme} nav={nav} />;
    if (v === 'assistant') return <AssistantScreen theme={theme} nav={nav} seed={seed} onSeedUsed={() => setSeed(null)} />;
    if (v === 'timeline') return <TimelineScreen theme={theme} nav={nav} />;
    if (v === 'profile') return <ProfileScreen theme={theme} nav={nav} dark={dark} setDark={setDark}
      accentKey={accentKey} setAccentKey={setAccentKey} />;
    if (v === 'health') return <HealthDashboard theme={theme} nav={nav} />;
    if (v === 'nutrition') return <NutritionScreen theme={theme} nav={nav} />;
    if (v === 'workouts') return <WorkoutsScreen theme={theme} nav={nav} />;
    if (v === 'body') return <BodyScreen theme={theme} nav={nav} />;
    if (v === 'history') return <HistoryScreen theme={theme} nav={nav} />;
    if (v === 'workout-live') return <WorkoutLive theme={theme} nav={nav} workout={workout} api={workoutApi} />;
    return <HomeScreen theme={theme} nav={nav} />;
  };

  const showLiveNav = top.view !== 'workout-live';
  const bannerVisible = workout && workout.active && top.view !== 'workout-live';

  return (
    <AppShell theme={theme}>
      <div key={top.view} className="forge-screen" style={{ position: 'absolute', inset: 0 }}>
        {renderFrame()}
      </div>

      {bannerVisible && <WorkoutBanner theme={theme} workout={workout} onOpen={nav.openWorkout} />}

      {showLiveNav && <BottomNav theme={theme} active={activeTab} onTab={(id) => nav.tab(id)} />}

      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} theme={theme} nav={nav} />
      <AddFoodSheet open={foodOpen} onClose={() => setFoodOpen(false)} theme={theme}
        onLogged={(kcal) => showToast(`Logged ${kcal} kcal to today`)} />
      <LogWeightSheet open={weightOpen} onClose={() => setWeightOpen(false)} theme={theme}
        onLogged={(w) => showToast(`Weight updated · ${w.toFixed(1)} kg`)} />

      {/* toast */}
      {toast && (
        <div style={{ position: 'absolute', bottom: showLiveNav ? NAV_H + 14 : 40, left: '50%',
          transform: 'translateX(-50%)', zIndex: Z.toast, padding: '11px 18px', borderRadius: 14,
          background: SCRIM, color: ON_ACCENT,
          fontSize: 13.5, fontWeight: 550, fontFamily: FONT, whiteSpace: 'nowrap', maxWidth: 340,
          overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          border: `1px solid ${theme.border2}`, animation: 'forgeRise .3s cubic-bezier(.32,.72,0,1)' }}>{toast}</div>
      )}
    </AppShell>
  );
}
