// store.jsx — Forge OS mutable data layer (Context + reducer, localStorage-persisted).
//
// This is the seam a real backend replaces next round: every action below maps 1:1 to a
// future API call (logFood → POST /meals, logWeight → POST /weight, …). Screens read
// mutable state through the selector hooks at the bottom — they no longer import the
// `const`s in data.js for anything that changes. data.js now provides SEED values only.
import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { HUE } from './theme.jsx';
import {
  TODAY, MACROS, MEALS, BODY_METRICS, WEIGHT_SERIES, WEIGHT_DATES, TIMELINE, INSIGHTS,
} from './data.js';

const KEY = 'forge_state_v1';
const VERSION = 1;

// ── helpers ─────────────────────────────────────────────────────
const nowHM = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const nowLabel = () => new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const round1 = (n) => Math.round(n * 10) / 10;
const sumKcal = (items) => items.reduce((s, i) => s + (i.kcal || 0), 0);
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// build a timeline entry from an action
function tl(icon, hue, title, sub, tag, accentRow = false, module = 'health') {
  return { id: uid('t'), t: nowHM(), module, icon, hue, title, sub, tag, accentRow };
}

// ── seed (initial state, mirrors the designed mock) ─────────────
function seedState() {
  return {
    version: VERSION,
    auth: { loggedIn: false, email: null, name: 'Alex Morgan' },
    today: {
      caloriesGoal: TODAY.caloriesGoal, caloriesOut: TODAY.caloriesOut,
      water: { v: TODAY.water.v, goal: TODAY.water.goal },
      steps: TODAY.steps, stepsGoal: TODAY.stepsGoal,
      weight: TODAY.weight, weightGoal: TODAY.weightGoal,
    },
    // consumed macros (goals/labels/colors stay static in MACROS; only `v` is live)
    macros: { protein: MACROS[0].v, carbs: MACROS[1].v, fat: MACROS[2].v },
    meals: MEALS.map(m => ({ ...m, items: m.items.map(i => ({ ...i })) })),
    weight: {
      series: [...WEIGHT_SERIES], dates: [...WEIGHT_DATES],
      current: BODY_METRICS[0].v, goal: BODY_METRICS[0].goal, start: WEIGHT_SERIES[0],
    },
    bodyMetrics: BODY_METRICS.map(m => ({ ...m, series: [...m.series] })),
    timeline: TIMELINE.map(e => ({ ...e })),
    insights: INSIGHTS.map(i => ({ ...i })),
    assistant: { messages: [] },
    settings: {
      goals: { weight: 72.0, protein: 160, calories: 2400 },
      preferences: { units: 'Metric', currency: 'INR' },
      notifications: { workouts: true, meals: true, insights: true, water: false },
    },
  };
}

function initState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === VERSION) return parsed;
    }
  } catch {}
  return seedState();
}

// ── reducer ─────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return { ...state, auth: { ...state.auth, loggedIn: true, email: action.email, name: action.name || state.auth.name } };
    case 'logout':
      return { ...state, auth: { ...state.auth, loggedIn: false } };
    case 'resetDemo':
      return { ...seedState(), auth: state.auth };

    case 'logFood': {
      const { mealId, items } = action;
      const meal = state.meals.find(m => m.id === mealId);
      const meals = state.meals.map(m => m.id === mealId
        ? { ...m, items: [...m.items, ...items], kcal: sumKcal([...m.items, ...items]) } : m);
      const add = items.reduce((a, i) => ({
        p: a.p + (i.p || 0), c: a.c + (i.c || 0), f: a.f + (i.f || 0),
      }), { p: 0, c: 0, f: 0 });
      const entry = tl('apple', HUE.cal, `${meal ? meal.meal : 'Food'} logged`,
        `${items[0].n}${items.length > 1 ? ` +${items.length - 1} more` : ''} · ${sumKcal(items)} kcal`, 'Nutrition');
      return {
        ...state, meals,
        macros: { protein: state.macros.protein + add.p, carbs: state.macros.carbs + add.c, fat: state.macros.fat + add.f },
        timeline: [entry, ...state.timeline],
      };
    }
    case 'addMeal':
      return { ...state, meals: [...state.meals, { id: uid('m'), meal: action.name, time: nowHM(), kcal: 0, items: [] }] };
    case 'editFoodItem': {
      const meals = state.meals.map(m => {
        if (m.id !== action.mealId) return m;
        const items = m.items.map((it, i) => i === action.i ? { ...it, ...action.patch } : it);
        return { ...m, items, kcal: sumKcal(items) };
      });
      return { ...state, meals };
    }
    case 'removeFoodItem': {
      const meal = state.meals.find(m => m.id === action.mealId);
      const removed = meal && meal.items[action.i];
      const meals = state.meals.map(m => {
        if (m.id !== action.mealId) return m;
        const items = m.items.filter((_, i) => i !== action.i);
        return { ...m, items, kcal: sumKcal(items) };
      });
      const macros = removed ? {
        protein: state.macros.protein - (removed.p || 0),
        carbs: state.macros.carbs - (removed.c || 0),
        fat: state.macros.fat - (removed.f || 0),
      } : state.macros;
      return { ...state, meals, macros };
    }

    case 'logWeight': {
      const kg = round1(action.kg);
      const series = [...state.weight.series, kg];
      const dates = [...state.weight.dates, nowLabel()];
      const bodyMetrics = state.bodyMetrics.map(m => m.key === 'weight'
        ? { ...m, v: kg, series, delta: round1(kg - series[0]) } : m);
      const prev = state.weight.current;
      const entry = tl('scale', HUE.weight, 'Weight updated',
        `${kg.toFixed(1)} kg · ${(kg - prev >= 0 ? '+' : '')}${round1(kg - prev)} from last`, 'Body');
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
      const entry = tl('drop', HUE.water, 'Water logged', `+${action.ml} ml · ${v} L today`, 'Hydration');
      return { ...state, today: { ...state.today, water: { ...state.today.water, v } }, timeline: [entry, ...state.timeline] };
    }
    case 'logWalk': {
      const { km = 0, min = 0, kcal = 0, steps = Math.round(km * 1300) } = action;
      const entry = tl('walk', HUE.burn, 'Walk tracked', `${km} km · ${min} min · ${kcal} kcal`, 'Activity');
      return {
        ...state,
        today: { ...state.today, steps: state.today.steps + steps, caloriesOut: state.today.caloriesOut + kcal },
        timeline: [entry, ...state.timeline],
      };
    }
    case 'finishWorkout': {
      const { name = 'Workout', mins = 1, sets = 0, exercises = 0, kcal = Math.round(mins * 8) } = action;
      const entry = tl('dumbbell', HUE.workout, `${name} workout completed`,
        `${mins} min · ${exercises} exercises · ${sets} sets`, 'Training', true);
      return {
        ...state,
        today: { ...state.today, caloriesOut: state.today.caloriesOut + kcal },
        timeline: [entry, ...state.timeline],
      };
    }

    case 'updateGoals':
      return { ...state, settings: { ...state.settings, goals: { ...state.settings.goals, ...action.patch } } };
    case 'updatePreferences':
      return { ...state, settings: { ...state.settings, preferences: { ...state.settings.preferences, ...action.patch } } };
    case 'toggleSetting':
      return { ...state, settings: { ...state.settings, notifications: {
        ...state.settings.notifications, [action.key]: !state.settings.notifications[action.key] } } };

    case 'setAssistant':
      return { ...state, assistant: { ...state.assistant, messages: action.messages } };
    case 'appendTimeline':
      return { ...state, timeline: [{ id: uid('t'), t: nowHM(), ...action.entry }, ...state.timeline] };

    default:
      return state;
  }
}

// ── provider ────────────────────────────────────────────────────
const Ctx = createContext(null);

export function ForgeStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, [state]);

  const actions = useMemo(() => ({
    login: (email, name) => dispatch({ type: 'login', email, name }),
    logout: () => dispatch({ type: 'logout' }),
    resetDemo: () => dispatch({ type: 'resetDemo' }),
    logFood: (mealId, items) => dispatch({ type: 'logFood', mealId, items }),
    addMeal: (name) => dispatch({ type: 'addMeal', name }),
    editFoodItem: (mealId, i, patch) => dispatch({ type: 'editFoodItem', mealId, i, patch }),
    removeFoodItem: (mealId, i) => dispatch({ type: 'removeFoodItem', mealId, i }),
    logWeight: (kg) => dispatch({ type: 'logWeight', kg }),
    logWater: (ml) => dispatch({ type: 'logWater', ml }),
    logWalk: (p) => dispatch({ type: 'logWalk', ...p }),
    finishWorkout: (p) => dispatch({ type: 'finishWorkout', ...p }),
    updateGoals: (patch) => dispatch({ type: 'updateGoals', patch }),
    updatePreferences: (patch) => dispatch({ type: 'updatePreferences', patch }),
    toggleSetting: (key) => dispatch({ type: 'toggleSetting', key }),
    setAssistantMessages: (messages) => dispatch({ type: 'setAssistant', messages }),
    appendTimeline: (entry) => dispatch({ type: 'appendTimeline', entry }),
  }), []);

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
export function useBodyMetrics() { return useStore().bodyMetrics; }
export function useInsights() { return useStore().insights; }
export function useMeals() { return useStore().meals; }

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
// timeline, optionally filtered by module id
export function useTimeline(filter = 'all') {
  const { timeline } = useStore();
  return filter === 'all' ? timeline : timeline.filter(e => e.module === filter);
}
