// App.jsx — Forge OS root: store provider, auth gate, navigation, sheets, toast.
import { useState, useCallback, useEffect, useRef } from 'react';
import { makeTheme, AppShell } from './theme.jsx';
import { ForgeStoreProvider, useStore } from './store.jsx';
import { LoginScreen } from './login.jsx';
import { BottomNav, Spotlight } from './nav.jsx';
import { HomeScreen, ModulesScreen, TimelineScreen, ProfileScreen } from './screens.jsx';
import { HealthDashboard } from './dashboard.jsx';
import { NutritionScreen } from './nutrition.jsx';
import { BodyScreen } from './body.jsx';
import { HistoryScreen } from './history.jsx';
import { AssistantScreen } from './assistant.jsx';
import { WorkoutsScreen, WorkoutLive, WorkoutBanner, elapsedOf } from './workout.jsx';
import { AddFoodSheet } from './foodsheet.jsx';
import { LogWeightSheet } from './weightsheet.jsx';
import { TrackWalkSheet } from './walksheet.jsx';
import { WORKOUT_TEMPLATES, WORKOUT_EXERCISES, PUSH_EXERCISES } from './data.js';
import { NAV_H, FONT, ON_ACCENT, SCRIM, Z } from './theme.jsx';

const TAB_OF = { home: 'home', modules: 'modules', assistant: 'assistant', timeline: 'timeline', profile: 'profile' };

function readStored(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function deepCopyTemplate(tplId, customName) {
  const tpl = WORKOUT_TEMPLATES.find(w => w.id === tplId) || WORKOUT_TEMPLATES[0];
  const exercises = WORKOUT_EXERCISES[tplId] || PUSH_EXERCISES;
  return {
    active: true, name: customName || tpl.name, startedAt: Date.now(), paused: false, pausedAt: 0, pausedTotal: 0,
    notes: '',
    exercises: exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, done: false })) })),
  };
}

// pick the meal to log into based on time of day (Agent A adds explicit per-meal choice)
function mealForNow(meals) {
  const h = new Date().getHours();
  const wanted = h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner';
  const m = meals.find(x => x.meal === wanted) || meals[meals.length - 1];
  return m ? m.id : null;
}

export default function App() {
  return (
    <ForgeStoreProvider>
      <AppInner />
    </ForgeStoreProvider>
  );
}

function AppInner() {
  const store = useStore();

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
  const [walkOpen, setWalkOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // workout store (persisted separately — a live session survives reloads)
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

  // surface store-level failures (optimistic action rollbacks) as a toast
  useEffect(() => {
    if (store.error) { showToast(store.error); store.clearError(); }
  }, [store.error, showToast]);

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
      else if (id === 'walk') setWalkOpen(true);
      else if (id === 'workout') nav.startWorkout('push');
      else if (id === 'water') { store.logWater(250); showToast('+250 ml water logged'); }
    },
    startWorkout: (tplId, customName) => {
      setSpotlightOpen(false);
      setWorkout(deepCopyTemplate(tplId, customName));
      setStack([{ view: 'health', tab: 'modules' }, { view: 'workout-live', tab: 'modules' }]);
    },
    openWorkout: () => setStack(s => s[s.length-1].view === 'workout-live' ? s
      : [...s.filter(f => f.view !== 'workout-live'), { view: 'workout-live', tab: 'modules' }]),
    minimizeWorkout: () => setStack(s => s.filter(f => f.view !== 'workout-live').length
      ? s.filter(f => f.view !== 'workout-live') : [{ view: 'health', tab: 'modules' }]),
  };

  // Installed PWAs get exactly one browser history entry per session by default, so the
  // OS back gesture/button has nothing to "go back" to and exits the app instead of
  // walking our in-memory nav stack. Trap it: push a dummy history entry whenever
  // something back-able is open, and on popstate close the topmost layer ourselves
  // (sheet > spotlight > stack frame > tab-to-home) — only a press at the true root
  // (Home tab, empty stack, nothing open) is left to fall through and actually exit.
  const backSnapshot = useRef({ stack, spotlightOpen, foodOpen, weightOpen, walkOpen });
  useEffect(() => { backSnapshot.current = { stack, spotlightOpen, foodOpen, weightOpen, walkOpen }; });
  useEffect(() => {
    window.history.replaceState({ forgeRoot: true }, '');
    window.history.pushState({ forgeTrap: true }, '');

    const onPopState = () => {
      const { stack, spotlightOpen, foodOpen, weightOpen, walkOpen } = backSnapshot.current;
      let handled = true;
      if (spotlightOpen) setSpotlightOpen(false);
      else if (weightOpen) setWeightOpen(false);
      else if (foodOpen) setFoodOpen(false);
      else if (walkOpen) setWalkOpen(false);
      else if (stack.length > 1) nav.back();
      else if (stack[0].tab !== 'home') nav.tab('home');
      else handled = false;

      if (handled) window.history.pushState({ forgeTrap: true }, '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ⌘K / Ctrl-K opens Spotlight (the palette advertises the shortcut).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setSpotlightOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const workoutApi = {
    toggleSet: (ei, si) => setWorkout(w => { const c = structuredClone(w);
      c.exercises[ei].sets[si].done = !c.exercises[ei].sets[si].done; return c; }),
    addSet: (ei) => setWorkout(w => { const c = structuredClone(w);
      const last = c.exercises[ei].sets[c.exercises[ei].sets.length - 1];
      c.exercises[ei].sets.push({ w: last ? last.w : 20, reps: last ? last.reps : 10, prev: '—', done: false });
      return c; }),
    editSet: (ei, si, patch) => setWorkout(w => { const c = structuredClone(w);
      c.exercises[ei].sets[si] = { ...c.exercises[ei].sets[si], ...patch }; return c; }),
    removeSet: (ei, si) => setWorkout(w => { const c = structuredClone(w);
      c.exercises[ei].sets.splice(si, 1); return c; }),
    addExercise: (ex) => setWorkout(w => { const c = structuredClone(w);
      c.exercises.push({ id: 'x' + Date.now(), name: ex.name, muscle: ex.muscle || '',
        sets: [{ w: 20, reps: 10, prev: '—', done: false }] }); return c; }),
    removeExercise: (ei) => setWorkout(w => { const c = structuredClone(w);
      c.exercises.splice(ei, 1); return c; }),
    setNotes: (text) => setWorkout(w => ({ ...w, notes: text })),
    pause: () => setWorkout(w => ({ ...w, paused: true, pausedAt: Date.now() })),
    resume: () => setWorkout(w => ({ ...w, paused: false, pausedTotal: (w.pausedTotal||0) + (Date.now() - w.pausedAt) })),
    finish: () => {
      const mins = Math.round(elapsedOf(workout) / 60000) || 1;
      const allSets = workout.exercises.flatMap(e => e.sets);
      const doneSets = allSets.filter(s => s.done).length || allSets.length;
      const volume = workout.exercises.reduce((sum, e) =>
        sum + e.sets.filter(s => s.done).reduce((a, s) => a + s.w * s.reps, 0), 0);
      store.finishWorkout({ name: workout.name, mins, sets: doneSets,
        exercises: workout.exercises.length, kcal: Math.round(mins * 8) });
      setWorkout(null);
      setStack([{ view: 'health', tab: 'modules' }]);
      showToast(`Workout saved · ${mins} min · ${(volume / 1000).toFixed(1)}k kg logged`);
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
      {store.authStatus === 'loading' || !store.ready ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: theme.text2, fontFamily: FONT, fontSize: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%',
              border: `3px solid ${theme.border2}`, borderTopColor: theme.accent.solid,
              animation: 'forgeSpin .7s linear infinite' }} />
            Loading your Forge…
          </div>
        </div>
      ) : store.authStatus !== 'in' ? (
        <LoginScreen theme={theme}
          onLogin={(email, password) => store.login(email, password).then(() => showToast('Welcome to Forge'))}
          onSignup={(name, email, password) => store.signup(email, password, name).then(() => showToast('Welcome to Forge'))} />
      ) : (
        <>
          <div key={top.view} className="forge-screen" style={{ position: 'absolute', inset: 0 }}>
            {renderFrame()}
          </div>

          {bannerVisible && <WorkoutBanner theme={theme} workout={workout} onOpen={nav.openWorkout} />}

          {showLiveNav && <BottomNav theme={theme} active={activeTab} onTab={(id) => nav.tab(id)} />}

          <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} theme={theme} nav={nav} />
          <AddFoodSheet open={foodOpen} onClose={() => setFoodOpen(false)} theme={theme}
            meals={store.meals}
            onLogged={(items, mealId) => { store.logFood(mealId || mealForNow(store.meals), items);
              showToast(`Logged ${items.reduce((s, i) => s + i.kcal, 0)} kcal to today`); }} />
          <LogWeightSheet open={weightOpen} onClose={() => setWeightOpen(false)} theme={theme}
            current={store.weight.current}
            onLogged={(w) => { store.logWeight(w); showToast(`Weight updated · ${w.toFixed(1)} kg`); }} />
          <TrackWalkSheet open={walkOpen} onClose={() => setWalkOpen(false)} theme={theme}
            onLogged={(p) => { store.logWalk(p); showToast(`Walk logged · ${p.km} km · ${p.kcal} kcal`); }} />

          {/* toast */}
          {toast && (
            <div style={{ position: 'absolute', bottom: showLiveNav ? NAV_H + 14 : 40, left: '50%',
              transform: 'translateX(-50%)', zIndex: Z.toast, padding: '11px 18px', borderRadius: 14,
              background: SCRIM, color: ON_ACCENT,
              fontSize: 13.5, fontWeight: 550, fontFamily: FONT, whiteSpace: 'nowrap', maxWidth: 340,
              overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              border: `1px solid ${theme.border2}`, animation: 'forgeRise .3s cubic-bezier(.32,.72,0,1)' }}>{toast}</div>
          )}
        </>
      )}
    </AppShell>
  );
}
