// store.jsx — Forge OS mutable data layer (Context + reducer, API-backed).
//
// Round 2: persistence moved from localStorage to the REST API (see api/CONTRACTS.md).
// The reducer stays as the *optimistic* UI layer — every action dispatches its instant
// reducer case first, then calls the API and reconciles from the server response; on
// failure it rolls back to a pre-action snapshot and surfaces an error. Screens read
// mutable state through the selector hooks at the bottom, unchanged.
//
// Static design tokens (labels/units/colors/icons/hues) still live client-side in
// data.js / theme.jsx — the server only sends dynamic values, and the selectors merge
// the tokens back in. Theme/dark/accent/workout localStorage lives in App.jsx, not here.
import { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback } from 'react';
import { HUE } from './theme.jsx';
import { MACROS, BODY_METRICS, INSIGHTS } from './data.js';
import * as api from './api.js';

const VERSION = 2;

// ── helpers ─────────────────────────────────────────────────────
const nowHM = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const nowLabel = () => new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const round1 = (n) => Math.round(n * 10) / 10;
const sumKcal = (items) => items.reduce((s, i) => s + (i.kcal || 0), 0);
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// consumed macros summed across every meal's items — the server derives `macros`
// the same way, so recomputing from meals keeps optimistic + reconciled state in sync.
const macrosFromMeals = (meals) => meals.reduce((a, m) => {
  for (const i of m.items || []) { a.protein += i.p || 0; a.carbs += i.c || 0; a.fat += i.f || 0; }
  return a;
}, { protein: 0, carbs: 0, fat: 0 });

// kind → design tokens. Server timeline/activity rows are token-free (kind only);
// the frontend owns icon/hue/accentRow. HUE keys verified against theme.jsx.
export const KIND_TOKENS = {
  food:    { icon: 'apple',    hue: HUE.cal,     accentRow: false },
  weight:  { icon: 'scale',    hue: HUE.weight,  accentRow: false },
  water:   { icon: 'drop',     hue: HUE.water,   accentRow: false },
  walk:    { icon: 'walk',     hue: HUE.burn,    accentRow: false },
  workout: { icon: 'dumbbell', hue: HUE.workout, accentRow: true },
};
// decorate a server timeline row (which lacks icon/hue/accentRow) for rendering.
export function decorateEntry(e) {
  const tok = KIND_TOKENS[e.kind];
  if (!tok || e.icon) return e; // already decorated (optimistic rows carry tokens)
  return { ...e, ...tok };
}

// ── empty shell (before /state hydrates) ────────────────────────
// insights are static (not part of /state); everything else is filled by hydrate().
function emptyState() {
  return {
    version: VERSION,
    authStatus: 'loading',   // 'loading' | 'out' | 'in'
    ready: false,
    error: null,
    auth: { loggedIn: false, email: null, name: 'Alex Morgan' },
    today: {
      caloriesGoal: 0, caloriesOut: 0,
      water: { v: 0, goal: 3.0 },
      steps: 0, stepsGoal: 10000,
      weight: 0, weightGoal: 0,
    },
    macros: { protein: 0, carbs: 0, fat: 0 },
    meals: [],
    weight: { series: [], dates: [], current: 0, goal: 0, start: 0 },
    bodyMetrics: BODY_METRICS.map(m => ({ key: m.key, v: m.v, delta: m.delta, series: [...m.series], goal: m.goal })),
    timeline: [],
    insights: INSIGHTS.map(i => ({ ...i })),
    assistant: { messages: [] },
    settings: {
      goals: { weight: 72.0, protein: 160, calories: 2400 },
      preferences: { units: 'Metric', currency: 'INR' },
      notifications: { workouts: true, meals: true, insights: true, water: false },
    },
  };
}

// map a GET /state payload → the data slices hydrate() replaces
function slicesFromState(s) {
  return {
    today: s.today,
    macros: s.macros,
    meals: s.meals,
    weight: s.weight,
    bodyMetrics: s.bodyMetrics,
    timeline: (s.timeline || []).map(decorateEntry),
    settings: s.settings,
  };
}

// ── reducer ─────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // auth / lifecycle
    case 'setStatus':
      return { ...state, authStatus: action.status, ready: action.ready ?? state.ready };
    case 'setAuth':
      return { ...state, auth: { ...state.auth, loggedIn: true, email: action.email, name: action.name || state.auth.name } };
    case 'clearAuth':
      return { ...emptyState(), authStatus: 'out', ready: true };
    case 'setError':
      return { ...state, error: action.error };
    case 'clearError':
      return { ...state, error: null };

    // replace the data slices (hydrate from /state, or roll back from a snapshot)
    case 'hydrate': {
      const d = action.data || {};
      return {
        ...state,
        today: d.today ?? state.today,
        macros: d.macros ?? state.macros,
        meals: d.meals ?? state.meals,
        weight: d.weight ?? state.weight,
        bodyMetrics: d.bodyMetrics ?? state.bodyMetrics,
        timeline: d.timeline ?? state.timeline,
        settings: d.settings ?? state.settings,
        ...(action.markIn ? { authStatus: 'in', ready: true } : null),
      };
    }

    case 'resetDemo': // client-only: no reset endpoint; clears the optimistic view
      return { ...emptyState(), auth: state.auth, authStatus: state.authStatus, ready: state.ready };

    // ── nutrition ──────────────────────────────────────────────
    case 'logFood': {
      const { mealId, items } = action;
      const meal = state.meals.find(m => m.id === mealId);
      const meals = state.meals.map(m => m.id === mealId
        ? { ...m, items: [...m.items, ...items], kcal: sumKcal([...m.items, ...items]) } : m);
      const entry = {
        id: action.tid, t: nowHM(), module: 'health', kind: 'food', ...KIND_TOKENS.food,
        title: `${meal ? meal.meal : 'Food'} logged`,
        sub: `${items[0].n}${items.length > 1 ? ` +${items.length - 1} more` : ''} · ${sumKcal(items)} kcal`,
        tag: 'Nutrition',
      };
      return { ...state, meals, macros: macrosFromMeals(meals), timeline: [entry, ...state.timeline] };
    }
    case 'addMeal':
      return { ...state, meals: [...state.meals, { id: action.tid, meal: action.name, time: nowHM(), kcal: 0, items: [] }] };
    case 'editFoodItem': {
      const meals = state.meals.map(m => {
        if (m.id !== action.mealId) return m;
        const items = m.items.map((it, i) => i === action.i ? { ...it, ...action.patch } : it);
        return { ...m, items, kcal: sumKcal(items) };
      });
      return { ...state, meals, macros: macrosFromMeals(meals) };
    }
    case 'removeFoodItem': {
      const meals = state.meals.map(m => {
        if (m.id !== action.mealId) return m;
        const items = m.items.filter((_, i) => i !== action.i);
        return { ...m, items, kcal: sumKcal(items) };
      });
      return { ...state, meals, macros: macrosFromMeals(meals) };
    }
    // reconcile a single meal from a server response, then recompute macros
    case 'reconcileMeal': {
      const meals = state.meals.map(m => m.id === action.meal.id ? action.meal : m);
      return { ...state, meals, macros: macrosFromMeals(meals) };
    }
    // replace an optimistic (temp-id) meal with the server-created one
    case 'replaceMeal': {
      const meals = state.meals.map(m => m.id === action.tid ? action.meal : m);
      return { ...state, meals, macros: macrosFromMeals(meals) };
    }

    // ── activity logs ──────────────────────────────────────────
    case 'logWeight': {
      const kg = round1(action.kg);
      const series = [...state.weight.series, kg];
      const dates = [...state.weight.dates, nowLabel()];
      const bodyMetrics = state.bodyMetrics.map(m => m.key === 'weight'
        ? { ...m, v: kg, series, delta: round1(kg - series[0]) } : m);
      const prev = state.weight.current;
      const entry = {
        id: action.tid, t: nowHM(), module: 'health', kind: 'weight', ...KIND_TOKENS.weight,
        title: 'Weight updated', sub: `${kg.toFixed(1)} kg · ${(kg - prev >= 0 ? '+' : '')}${round1(kg - prev)} from last`, tag: 'Body',
      };
      return {
        ...state,
        weight: { ...state.weight, series, dates, current: kg },
        today: { ...state.today, weight: kg },
        bodyMetrics,
        timeline: [entry, ...state.timeline],
      };
    }
    case 'logWater': {
      const v = round1(state.today.water.v + (action.ml || 0) / 1000);
      const entry = {
        id: action.tid, t: nowHM(), module: 'health', kind: 'water', ...KIND_TOKENS.water,
        title: 'Water logged', sub: `+${action.ml} ml · ${v} L today`, tag: 'Hydration',
      };
      return { ...state, today: { ...state.today, water: { ...state.today.water, v } }, timeline: [entry, ...state.timeline] };
    }
    case 'logWalk': {
      const { km = 0, min = 0, kcal = 0, steps = Math.round(km * 1300) } = action;
      const entry = {
        id: action.tid, t: nowHM(), module: 'health', kind: 'walk', ...KIND_TOKENS.walk,
        title: 'Walk tracked', sub: `${km} km · ${min} min · ${kcal} kcal`, tag: 'Activity',
      };
      return {
        ...state,
        today: { ...state.today, steps: state.today.steps + steps, caloriesOut: state.today.caloriesOut + kcal },
        timeline: [entry, ...state.timeline],
      };
    }
    case 'finishWorkout': {
      const { name = 'Workout', mins = 1, sets = 0, exercises = 0, kcal = Math.round(mins * 8) } = action;
      const entry = {
        id: action.tid, t: nowHM(), module: 'health', kind: 'workout', ...KIND_TOKENS.workout,
        title: `${name} workout completed`, sub: `${mins} min · ${exercises} exercises · ${sets} sets`, tag: 'Training',
      };
      return {
        ...state,
        today: { ...state.today, caloriesOut: state.today.caloriesOut + kcal },
        timeline: [entry, ...state.timeline],
      };
    }
    // replace an optimistic timeline row with the server entry (token-free → decorated)
    case 'reconcileEntry': {
      const decorated = decorateEntry(action.entry);
      return { ...state, timeline: state.timeline.map(e => e.id === action.tid ? decorated : e) };
    }

    // ── settings ───────────────────────────────────────────────
    case 'updateGoals':
      return { ...state, settings: { ...state.settings, goals: { ...state.settings.goals, ...action.patch } } };
    case 'updatePreferences':
      return { ...state, settings: { ...state.settings, preferences: { ...state.settings.preferences, ...action.patch } } };
    case 'toggleSetting':
      return { ...state, settings: { ...state.settings, notifications: {
        ...state.settings.notifications, [action.key]: !state.settings.notifications[action.key] } } };
    case 'reconcileSettings':
      return { ...state, settings: { ...state.settings, [action.slice]: action.value } };

    // ── assistant / misc (client-only) ─────────────────────────
    case 'setAssistant':
      return { ...state, assistant: { ...state.assistant, messages: action.messages } };
    case 'appendTimeline':
      return { ...state, timeline: [decorateEntry({ id: uid('t'), t: nowHM(), ...action.entry }), ...state.timeline] };

    default:
      return state;
  }
}

// ── provider ────────────────────────────────────────────────────
const Ctx = createContext(null);

export function ForgeStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyState);

  // latest state for snapshot-based rollback / derived values inside async actions
  const stateRef = useRef(state);
  stateRef.current = state;

  // grab the current data slices (for rollback on API failure)
  const snapshot = useCallback(() => {
    const s = stateRef.current;
    return { today: s.today, macros: s.macros, meals: s.meals, weight: s.weight,
      bodyMetrics: s.bodyMetrics, timeline: s.timeline, settings: s.settings };
  }, []);

  // optimistic wrapper: dispatch instantly, call API, reconcile or roll back + toast
  const run = useCallback(async (optimistic, call, reconcile) => {
    const before = snapshot();
    dispatch(optimistic);
    try {
      const res = await call();
      if (reconcile) reconcile(res);
    } catch (err) {
      dispatch({ type: 'hydrate', data: before });
      dispatch({ type: 'setError', error: err.message || 'Something went wrong' });
    }
  }, [snapshot]);

  const hydrateFromServer = useCallback(async () => {
    const s = await api.get('/state');
    dispatch({ type: 'hydrate', data: slicesFromState(s), markIn: true });
  }, []);

  // ── auth bootstrap on mount ──────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get('/auth/me');
        if (!alive) return;
        dispatch({ type: 'setAuth', email: me.user.email, name: me.user.name });
        await hydrateFromServer();
      } catch {
        if (alive) dispatch({ type: 'setStatus', status: 'out', ready: true });
      }
    })();
    return () => { alive = false; };
  }, [hydrateFromServer]);

  const actions = useMemo(() => ({
    // ── auth (throw so login.jsx can show inline errors) ───────
    login: async (email, password) => {
      const { user } = await api.post('/auth/login', { email, password });
      dispatch({ type: 'setAuth', email: user.email, name: user.name });
      await hydrateFromServer();
    },
    signup: async (email, password, name) => {
      const { user } = await api.post('/auth/signup', { email, password, name });
      dispatch({ type: 'setAuth', email: user.email, name: user.name });
      await hydrateFromServer();
    },
    logout: async () => {
      try { await api.post('/auth/logout'); } catch {}
      dispatch({ type: 'clearAuth' });
    },
    resetDemo: () => dispatch({ type: 'resetDemo' }),

    // ── nutrition ──────────────────────────────────────────────
    logFood: (mealId, items) => run(
      { type: 'logFood', mealId, items, tid: uid('t') },
      () => api.post(`/meals/${mealId}/items`, { items }),
      (res) => dispatch({ type: 'reconcileMeal', meal: res.meal }),
    ),
    addMeal: (name) => { const tid = uid('m'); return run(
      { type: 'addMeal', name, tid },
      () => api.post('/meals', { name }),
      (res) => dispatch({ type: 'replaceMeal', tid, meal: res.meal }),
    ); },
    editFoodItem: (mealId, i, patch) => run(
      { type: 'editFoodItem', mealId, i, patch },
      () => api.patch(`/meals/${mealId}/items/${i}`, { patch }),
      (res) => dispatch({ type: 'reconcileMeal', meal: res.meal }),
    ),
    removeFoodItem: (mealId, i) => run(
      { type: 'removeFoodItem', mealId, i },
      () => api.del(`/meals/${mealId}/items/${i}`),
      (res) => dispatch({ type: 'reconcileMeal', meal: res.meal }),
    ),

    // ── activity logs (server {entry} replaces the optimistic head) ──
    logWeight: (kg) => { const tid = uid('t'); return run(
      { type: 'logWeight', kg, tid },
      () => api.post('/weight', { kg }),
      (res) => dispatch({ type: 'reconcileEntry', tid, entry: res.entry }),
    ); },
    logWater: (ml) => { const tid = uid('t'); return run(
      { type: 'logWater', ml, tid },
      () => api.post('/water', { ml }),
      (res) => dispatch({ type: 'reconcileEntry', tid, entry: res.entry }),
    ); },
    logWalk: (p) => { const tid = uid('t'); return run(
      { type: 'logWalk', ...p, tid },
      () => api.post('/walks', p),
      (res) => dispatch({ type: 'reconcileEntry', tid, entry: res.entry }),
    ); },
    finishWorkout: (p) => { const tid = uid('t'); return run(
      { type: 'finishWorkout', ...p, tid },
      () => api.post('/workouts', p),
      (res) => dispatch({ type: 'reconcileEntry', tid, entry: res.entry }),
    ); },

    // ── settings (merge-patch; server returns the merged slice) ──
    updateGoals: (patch) => run(
      { type: 'updateGoals', patch },
      () => api.patch('/settings/goals', { patch }),
      (res) => dispatch({ type: 'reconcileSettings', slice: 'goals', value: res.goals }),
    ),
    updatePreferences: (patch) => run(
      { type: 'updatePreferences', patch },
      () => api.patch('/settings/preferences', { patch }),
      (res) => dispatch({ type: 'reconcileSettings', slice: 'preferences', value: res.preferences }),
    ),
    toggleSetting: (key) => {
      const next = !stateRef.current.settings.notifications[key];
      return run(
        { type: 'toggleSetting', key },
        () => api.patch('/settings/notifications', { patch: { [key]: next } }),
        (res) => dispatch({ type: 'reconcileSettings', slice: 'notifications', value: res.notifications }),
      );
    },

    // ── client-only ────────────────────────────────────────────
    setAssistantMessages: (messages) => dispatch({ type: 'setAssistant', messages }),
    appendTimeline: (entry) => dispatch({ type: 'appendTimeline', entry }),
    clearError: () => dispatch({ type: 'clearError' }),
  }), [run, hydrateFromServer]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ── hooks / selectors ───────────────────────────────────────────
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within ForgeStoreProvider');
  return v;
}
export function useAuth() { return useStore().auth; }
export function useSettings() { return useStore().settings; }
export function useAssistant() { return useStore().assistant; }
export function useWeight() { return useStore().weight; }
export function useInsights() { return useStore().insights; }
export function useMeals() { return useStore().meals; }

// BODY_METRICS with static label/unit/color merged onto the dynamic {v,delta,series,goal}
// by `key` (mirrors how useMacros merges MACROS). Server sends dynamic values only.
export function useBodyMetrics() {
  const { bodyMetrics } = useStore();
  return BODY_METRICS.map(m => {
    const d = bodyMetrics.find(x => x.key === m.key);
    return d ? { ...m, v: d.v, delta: d.delta, series: d.series, goal: d.goal } : m;
  });
}

// today with derived caloriesIn (sum of all meal kcals)
export function useToday() {
  const { today, meals } = useStore();
  const caloriesIn = meals.reduce((s, m) => s + m.kcal, 0);
  return { ...today, caloriesIn };
}
// MACROS array with live consumed `v` merged in (keeps labels/goals/colors)
export function useMacros() {
  const { macros } = useStore();
  return MACROS.map(m => ({ ...m, v: macros[m.key] }));
}
// timeline, optionally filtered by module id (rows are already decorated with tokens)
export function useTimeline(filter = 'all') {
  const { timeline } = useStore();
  return filter === 'all' ? timeline : timeline.filter(e => e.module === filter);
}
