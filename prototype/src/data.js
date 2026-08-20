// data.js — Forge OS mock data layer.
import { HUE } from './theme.jsx';

// ── Modules registry (Health installed; rest are "future") ──────
export const MODULES = [
  { id: 'health',   name: 'Health',        icon: 'heart',       hue: HUE.health,   installed: true,
    tagline: 'Nutrition · Training · Body', stat: '2,140 kcal', sub: 'today' },
  { id: 'finance',  name: 'Finance',       icon: 'wallet',      hue: HUE.finance,  installed: false,
    tagline: 'Spending · Budgets · Goals',  stat: '₹1,200',     sub: 'today' },
  { id: 'learning', name: 'Knowledge',     icon: 'book',        hue: HUE.learning, installed: true,
    tagline: 'Notes · Reading · Recall',    stat: '',           sub: '' },
  { id: 'projects', name: 'Projects',      icon: 'layers',      hue: HUE.projects, installed: false,
    tagline: 'Goals · Milestones',          stat: '3 done',     sub: 'this week' },
  { id: 'tasks',    name: 'Tasks',         icon: 'checkSquare', hue: HUE.tasks,    installed: false,
    tagline: 'To-dos · Routines',           stat: '5 left',     sub: 'today' },
  { id: 'documents',name: 'Documents',     icon: 'doc',         hue: HUE.documents,installed: false,
    tagline: 'Files · Records',             stat: '128',        sub: 'stored' },
  { id: 'travel',   name: 'Travel',        icon: 'plane',       hue: HUE.travel,   installed: false,
    tagline: 'Trips · Routes',              stat: '—',          sub: '' },
  { id: 'home',     name: 'Home',          icon: 'home2',       hue: HUE.home,     installed: false,
    tagline: 'Devices · Spaces',            stat: '—',          sub: '' },
  { id: 'relationships', name: 'People',   icon: 'user',        hue: HUE.relationships, installed: false,
    tagline: 'Contacts · Moments',          stat: '—',          sub: '' },
];

// ── Today's health snapshot ─────────────────────────────────────
export const TODAY = {
  caloriesIn: 2140, caloriesGoal: 2400, caloriesOut: 620,
  protein: { v: 118, goal: 160 }, carbs: { v: 210, goal: 280 }, fat: { v: 64, goal: 80 },
  water: { v: 1.8, goal: 3.0 }, steps: 7820, stepsGoal: 10000,
  weight: 74.2, weightGoal: 72.0,
};

// macro breakdown for ring cluster
export const MACROS = [
  { key: 'protein', label: 'Protein', v: 118, goal: 160, unit: 'g', color: HUE.protein },
  { key: 'carbs',   label: 'Carbs',   v: 210, goal: 280, unit: 'g', color: HUE.carbs },
  { key: 'fat',     label: 'Fat',     v: 64,  goal: 80,  unit: 'g', color: HUE.fat },
];

// ── Meals ───────────────────────────────────────────────────────
export const MEALS = [
  { id: 'm1', meal: 'Breakfast', time: '08:10', kcal: 520, items: [
      { n: 'Greek yogurt bowl', kcal: 280, p: 22, c: 30, f: 8, emoji: '🥣' },
      { n: 'Black coffee', kcal: 5, p: 0, c: 1, f: 0, emoji: '☕' },
      { n: 'Banana', kcal: 105, p: 1, c: 27, f: 0, emoji: '🍌' },
      { n: 'Almonds (15g)', kcal: 130, p: 5, c: 5, f: 11, emoji: '🥜' },
  ]},
  { id: 'm2', meal: 'Lunch', time: '13:25', kcal: 740, items: [
      { n: 'Grilled chicken', kcal: 330, p: 52, c: 0, f: 12, emoji: '🍗' },
      { n: 'Brown rice', kcal: 240, p: 5, c: 50, f: 2, emoji: '🍚' },
      { n: 'Mixed salad', kcal: 90, p: 3, c: 10, f: 5, emoji: '🥗' },
      { n: 'Olive oil', kcal: 80, p: 0, c: 0, f: 9, emoji: '🫒' },
  ]},
  { id: 'm3', meal: 'Snack', time: '17:00', kcal: 210, items: [
      { n: 'Protein shake', kcal: 160, p: 30, c: 6, f: 2, emoji: '🥤' },
      { n: 'Apple', kcal: 50, p: 0, c: 13, f: 0, emoji: '🍎' },
  ]},
  { id: 'm4', meal: 'Dinner', time: '20:15', kcal: 670, items: [
      { n: 'Salmon fillet', kcal: 360, p: 40, c: 0, f: 22, emoji: '🐟' },
      { n: 'Sweet potato', kcal: 180, p: 4, c: 41, f: 0, emoji: '🍠' },
      { n: 'Broccoli', kcal: 55, p: 4, c: 11, f: 1, emoji: '🥦' },
      { n: 'Greens', kcal: 75, p: 2, c: 8, f: 4, emoji: '🥬' },
  ]},
];

// ── Workout templates & exercises ───────────────────────────────
// swatch colors below are an independent categorical palette, not tied to
// HUE — don't dedupe against HUE values that happen to match.
export const WORKOUT_TEMPLATES = [
  { id: 'push', name: 'Push',  hue: HUE.workout, sub: 'Chest · Shoulders · Triceps', last: '3d ago', exCount: 5 },
  { id: 'pull', name: 'Pull',  hue: '#4f8cff', sub: 'Back · Biceps · Rear delts', last: '5d ago', exCount: 6 },
  { id: 'legs', name: 'Legs',  hue: '#34d399', sub: 'Quads · Hamstrings · Calves', last: '2d ago', exCount: 5 },
  { id: 'upper',name: 'Upper', hue: '#c084fc', sub: 'Full upper body', last: '1w ago', exCount: 7 },
  { id: 'lower',name: 'Lower', hue: '#f5a623', sub: 'Full lower body', last: '1w ago', exCount: 5 },
];

export const PUSH_EXERCISES = [
  { id: 'e1', name: 'Bench Press', muscle: 'Chest', sets: [
      { w: 60, reps: 10, prev: '60×10' }, { w: 70, reps: 8, prev: '67.5×8' }, { w: 75, reps: 6, prev: '72.5×6' } ] },
  { id: 'e2', name: 'Incline Dumbbell Press', muscle: 'Upper chest', sets: [
      { w: 24, reps: 12, prev: '22×12' }, { w: 26, reps: 10, prev: '24×10' }, { w: 26, reps: 9, prev: '24×9' } ] },
  { id: 'e3', name: 'Shoulder Press', muscle: 'Shoulders', sets: [
      { w: 40, reps: 10, prev: '40×10' }, { w: 45, reps: 8, prev: '42.5×8' } ] },
  { id: 'e4', name: 'Lateral Raise', muscle: 'Side delts', sets: [
      { w: 10, reps: 15, prev: '10×15' }, { w: 12, reps: 12, prev: '10×14' }, { w: 12, reps: 10, prev: '10×12' } ] },
  { id: 'e5', name: 'Triceps Pushdown', muscle: 'Triceps', sets: [
      { w: 25, reps: 14, prev: '22.5×14' }, { w: 30, reps: 12, prev: '27.5×12' } ] },
];

// ── Body metrics history ────────────────────────────────────────
export const WEIGHT_SERIES = [76.1, 75.8, 75.9, 75.4, 75.0, 74.9, 74.6, 74.7, 74.3, 74.2];
export const WEIGHT_DATES = ['Apr 1','Apr 8','Apr 15','Apr 22','Apr 29','May 6','May 13','May 20','May 27','Jun 3'];
export const BODYFAT_SERIES = [19.2, 18.9, 18.6, 18.4, 18.0, 17.7, 17.5, 17.2];
export const CALORIE_WEEK = [2210, 1980, 2350, 2140, 2480, 2050, 2140]; // mon..sun
export const PROTEIN_WEEK = [142, 120, 158, 134, 165, 128, 118];
export const BURN_WEEK = [380, 720, 210, 620, 0, 540, 620];
export const WEEK_LABELS = ['M','T','W','T','F','S','S'];

// swatch colors below are an independent categorical palette, not tied to
// HUE — don't dedupe against HUE values that happen to match.
export const BODY_METRICS = [
  { key: 'weight', label: 'Weight',    v: 74.2, unit: 'kg', delta: -1.9, color: HUE.weight, series: WEIGHT_SERIES, goal: 72.0 },
  { key: 'bodyfat',label: 'Body Fat',  v: 17.2, unit: '%',  delta: -2.0, color: '#f472b6', series: BODYFAT_SERIES, goal: 15.0 },
  { key: 'waist',  label: 'Waist',     v: 81,   unit: 'cm', delta: -3,   color: '#38bdf8', series: [85,84,84,83,82,82,81,81], goal: 78 },
];

// ── Timeline (cross-module) ─────────────────────────────────────
export const TIMELINE = [
  { id: 't1', t: '20:15', module: 'health', icon: 'apple', hue: HUE.cal, title: 'Dinner logged', sub: 'Salmon, sweet potato · 670 kcal', tag: 'Nutrition' },
  { id: 't2', t: '18:40', module: 'health', icon: 'dumbbell', hue: HUE.workout, title: 'Push workout completed', sub: '52 min · 5 exercises · 14 sets', tag: 'Training', accentRow: true },
  { id: 't3', t: '17:00', module: 'health', icon: 'apple', hue: HUE.cal, title: 'Snack logged', sub: 'Protein shake, apple · 210 kcal', tag: 'Nutrition' },
  { id: 't4', t: '16:20', module: 'finance', icon: 'wallet', hue: HUE.finance, title: 'Expense added', sub: 'Lunch out · ₹420', tag: 'Finance' },
  { id: 't5', t: '13:25', module: 'health', icon: 'apple', hue: HUE.cal, title: 'Lunch logged', sub: 'Chicken & rice bowl · 740 kcal', tag: 'Nutrition' },
  { id: 't6', t: '12:05', module: 'health', icon: 'walk', hue: HUE.burn, title: 'Brisk walk', sub: '2.4 km · 28 min · 142 kcal', tag: 'Activity' },
  { id: 't7', t: '09:30', module: 'learning', icon: 'book', hue: HUE.learning, title: 'Reading session', sub: 'Atomic Habits · 22 pages', tag: 'Learning' },
  { id: 't8', t: '08:10', module: 'health', icon: 'apple', hue: HUE.cal, title: 'Breakfast logged', sub: 'Yogurt bowl, coffee · 520 kcal', tag: 'Nutrition' },
  { id: 't9', t: '07:05', module: 'health', icon: 'scale', hue: HUE.weight, title: 'Weight updated', sub: '74.2 kg · -0.1 from yesterday', tag: 'Body' },
];

// ── AI Insights ─────────────────────────────────────────────────
export const INSIGHTS = [
  { id: 'i1', kind: 'pattern', hue: HUE.protein, icon: 'trend',
    title: 'Protein dips on rest days', body: 'On days you don\'t train, protein averages 122g vs 158g on training days. Consider a shake on Wed & Sun.' },
  { id: 'i2', kind: 'progress', hue: HUE.weight, icon: 'target',
    title: 'On track for 72 kg', body: 'You\'re down 1.9 kg in 5 weeks — about 0.38 kg/week. At this pace you\'ll hit your goal by Jun 28.' },
  { id: 'i3', kind: 'win', hue: HUE.workout, icon: 'flame',
    title: '4-day training streak', body: 'Your longest in 6 weeks. Consistency is up 30% vs last month.' },
];

// ── Assistant: suggested prompts + canned cross-module answers ───
export const SUGGESTIONS = [
  'How many calories did I eat this week?',
  'How consistent have I been with workouts?',
  'How much did I spend eating out?',
  'Summarize my week',
];

// answer objects can carry rich "cards" the assistant renders inline
export const ASSISTANT_ANSWERS = {
  'How many calories did I eat this week?': {
    text: "This week you've averaged 2,193 kcal/day across 7 days — just under your 2,400 goal. Your highest day was Friday (2,480) and lowest was Tuesday (1,980).",
    chart: { type: 'bars', label: 'Daily calories', data: CALORIE_WEEK, labels: WEEK_LABELS, color: HUE.cal, unit: 'kcal' },
    sources: ['Health · Nutrition'],
  },
  'How consistent have I been with workouts?': {
    text: "You've completed 4 sessions this week (Push, Pull, Legs, Pull) — a 4-day streak and your best in 6 weeks. Training-day protein averaged 158g vs 122g on rest days.",
    chart: { type: 'bars', label: 'Calories burned / training', data: BURN_WEEK, labels: WEEK_LABELS, color: HUE.burn, unit: 'kcal' },
    sources: ['Health · Workouts', 'Health · Activities'],
  },
  'How much did I spend eating out?': {
    text: "Eating out came to ₹3,240 over the last 7 days across 6 transactions — 28% of your food budget. Lunch was the biggest category at ₹1,860.",
    chart: { type: 'split', label: 'Dining spend', data: [{ n: 'Lunch', v: 1860, c: HUE.finance }, { n: 'Coffee', v: 720, c: '#fb923c' }, { n: 'Dinner', v: 660, c: '#f87171' }], unit: '₹' },
    sources: ['Finance · Expenses'],
  },
  'Summarize my week': {
    text: "Strong week overall. You trained 4×, stayed under your calorie goal 6 of 7 days, and dropped 0.4 kg. Reading is steady at 45 min/day. Spending on dining is slightly above budget.",
    summary: [
      { icon: 'dumbbell', hue: HUE.workout, k: 'Training', v: '4 sessions', d: '+1 vs last wk' },
      { icon: 'flame', hue: HUE.cal, k: 'Avg calories', v: '2,193 kcal', d: 'under goal' },
      { icon: 'scale', hue: HUE.weight, k: 'Weight', v: '74.2 kg', d: '-0.4 kg' },
      { icon: 'wallet', hue: HUE.finance, k: 'Dining', v: '₹3,240', d: 'over budget' },
    ],
    sources: ['Health', 'Finance', 'Learning'],
  },
};

export const QUICK_ACTIONS = [
  { id: 'food', label: 'Log Food', icon: 'apple', hue: HUE.cal },
  { id: 'workout', label: 'Start Workout', icon: 'dumbbell', hue: HUE.workout },
  { id: 'walk', label: 'Track Walk', icon: 'walk', hue: HUE.burn },
  { id: 'weight', label: 'Log Weight', icon: 'scale', hue: HUE.weight },
];

// ── Per-template exercise libraries ─────────────────────────────
// Each template starts a session from its own exercises (previously every template
// wrongly reused PUSH_EXERCISES). `prev` is illustrative last-session performance.
export const PULL_EXERCISES = [
  { id: 'pl1', name: 'Pull-Up', muscle: 'Lats', sets: [
      { w: 0, reps: 10, prev: 'BW×10' }, { w: 0, reps: 8, prev: 'BW×9' }, { w: 5, reps: 6, prev: 'BW×8' } ] },
  { id: 'pl2', name: 'Barbell Row', muscle: 'Back', sets: [
      { w: 70, reps: 10, prev: '67.5×10' }, { w: 75, reps: 8, prev: '72.5×8' }, { w: 75, reps: 8, prev: '72.5×8' } ] },
  { id: 'pl3', name: 'Lat Pulldown', muscle: 'Lats', sets: [
      { w: 60, reps: 12, prev: '57.5×12' }, { w: 65, reps: 10, prev: '62.5×10' } ] },
  { id: 'pl4', name: 'Seated Cable Row', muscle: 'Mid-back', sets: [
      { w: 55, reps: 12, prev: '52.5×12' }, { w: 60, reps: 10, prev: '57.5×10' } ] },
  { id: 'pl5', name: 'Face Pull', muscle: 'Rear delts', sets: [
      { w: 25, reps: 15, prev: '22.5×15' }, { w: 27.5, reps: 12, prev: '25×12' } ] },
  { id: 'pl6', name: 'Barbell Curl', muscle: 'Biceps', sets: [
      { w: 30, reps: 12, prev: '27.5×12' }, { w: 32.5, reps: 10, prev: '30×10' } ] },
];
export const LEGS_EXERCISES = [
  { id: 'lg1', name: 'Back Squat', muscle: 'Quads', sets: [
      { w: 90, reps: 8, prev: '87.5×8' }, { w: 100, reps: 6, prev: '95×6' }, { w: 105, reps: 5, prev: '100×5' } ] },
  { id: 'lg2', name: 'Romanian Deadlift', muscle: 'Hamstrings', sets: [
      { w: 80, reps: 10, prev: '77.5×10' }, { w: 85, reps: 8, prev: '82.5×8' } ] },
  { id: 'lg3', name: 'Leg Press', muscle: 'Quads', sets: [
      { w: 160, reps: 12, prev: '150×12' }, { w: 170, reps: 10, prev: '160×10' } ] },
  { id: 'lg4', name: 'Seated Leg Curl', muscle: 'Hamstrings', sets: [
      { w: 45, reps: 14, prev: '42.5×14' }, { w: 50, reps: 12, prev: '47.5×12' } ] },
  { id: 'lg5', name: 'Calf Raise', muscle: 'Calves', sets: [
      { w: 70, reps: 15, prev: '65×15' }, { w: 75, reps: 15, prev: '70×15' }, { w: 80, reps: 12, prev: '75×12' } ] },
];
export const UPPER_EXERCISES = [
  { id: 'up1', name: 'Bench Press', muscle: 'Chest', sets: [
      { w: 70, reps: 8, prev: '67.5×8' }, { w: 75, reps: 6, prev: '72.5×6' } ] },
  { id: 'up2', name: 'Barbell Row', muscle: 'Back', sets: [
      { w: 72.5, reps: 10, prev: '70×10' }, { w: 75, reps: 8, prev: '72.5×8' } ] },
  { id: 'up3', name: 'Overhead Press', muscle: 'Shoulders', sets: [
      { w: 45, reps: 8, prev: '42.5×8' }, { w: 47.5, reps: 6, prev: '45×6' } ] },
  { id: 'up4', name: 'Lat Pulldown', muscle: 'Lats', sets: [
      { w: 62.5, reps: 12, prev: '60×12' }, { w: 65, reps: 10, prev: '62.5×10' } ] },
  { id: 'up5', name: 'Incline Dumbbell Press', muscle: 'Upper chest', sets: [
      { w: 26, reps: 10, prev: '24×10' }, { w: 28, reps: 8, prev: '26×8' } ] },
  { id: 'up6', name: 'Lateral Raise', muscle: 'Side delts', sets: [
      { w: 12, reps: 15, prev: '10×15' }, { w: 12, reps: 12, prev: '10×14' } ] },
  { id: 'up7', name: 'Barbell Curl', muscle: 'Biceps', sets: [
      { w: 30, reps: 12, prev: '27.5×12' }, { w: 32.5, reps: 10, prev: '30×10' } ] },
];
export const LOWER_EXERCISES = [
  { id: 'lw1', name: 'Back Squat', muscle: 'Quads', sets: [
      { w: 95, reps: 8, prev: '92.5×8' }, { w: 100, reps: 6, prev: '97.5×6' } ] },
  { id: 'lw2', name: 'Deadlift', muscle: 'Posterior chain', sets: [
      { w: 120, reps: 5, prev: '117.5×5' }, { w: 130, reps: 3, prev: '125×3' } ] },
  { id: 'lw3', name: 'Leg Extension', muscle: 'Quads', sets: [
      { w: 55, reps: 15, prev: '50×15' }, { w: 60, reps: 12, prev: '55×12' } ] },
  { id: 'lw4', name: 'Lying Leg Curl', muscle: 'Hamstrings', sets: [
      { w: 45, reps: 14, prev: '42.5×14' }, { w: 50, reps: 12, prev: '47.5×12' } ] },
  { id: 'lw5', name: 'Calf Raise', muscle: 'Calves', sets: [
      { w: 75, reps: 15, prev: '70×15' }, { w: 80, reps: 12, prev: '75×12' } ] },
];
// template id → exercise array (deepCopyTemplate reads this)
export const WORKOUT_EXERCISES = {
  push: PUSH_EXERCISES, pull: PULL_EXERCISES, legs: LEGS_EXERCISES,
  upper: UPPER_EXERCISES, lower: LOWER_EXERCISES,
};
// exercises the "Add exercise" picker offers
export const EXERCISE_LIBRARY = [
  ...PUSH_EXERCISES, ...PULL_EXERCISES, ...LEGS_EXERCISES,
].map(e => ({ name: e.name, muscle: e.muscle }))
  .filter((e, i, a) => a.findIndex(x => x.name === e.name) === i);

// ── Add Food sheet: simulated photo/voice detection + recent list ─
export const DETECTED_FOOD = [
  { n: 'Grilled chicken breast', portion: '180 g', kcal: 297, p: 56, c: 0, f: 7, conf: 0.96, emoji: '🍗' },
  { n: 'Steamed broccoli', portion: '1 cup', kcal: 55, p: 4, c: 11, f: 1, conf: 0.93, emoji: '🥦' },
  { n: 'Brown rice', portion: '1 cup', kcal: 216, p: 5, c: 45, f: 2, conf: 0.88, emoji: '🍚' },
];
export const RECENT_FOODS = [
  { n: 'Greek yogurt bowl', kcal: 280, emoji: '🥣' },
  { n: 'Protein shake', kcal: 160, emoji: '🥤' },
  { n: 'Banana', kcal: 105, emoji: '🍌' },
  { n: 'Black coffee', kcal: 5, emoji: '☕' },
];

// ── Food database (manual search in Add Food) ───────────────────
export const FOOD_DB = [
  { n: 'Greek yogurt bowl', kcal: 280, p: 22, c: 30, f: 8, emoji: '🥣' },
  { n: 'Protein shake', kcal: 160, p: 30, c: 6, f: 2, emoji: '🥤' },
  { n: 'Banana', kcal: 105, p: 1, c: 27, f: 0, emoji: '🍌' },
  { n: 'Black coffee', kcal: 5, p: 0, c: 1, f: 0, emoji: '☕' },
  { n: 'Grilled chicken breast', kcal: 297, p: 56, c: 0, f: 7, emoji: '🍗' },
  { n: 'Brown rice', kcal: 216, p: 5, c: 45, f: 2, emoji: '🍚' },
  { n: 'Steamed broccoli', kcal: 55, p: 4, c: 11, f: 1, emoji: '🥦' },
  { n: 'Salmon fillet', kcal: 360, p: 40, c: 0, f: 22, emoji: '🐟' },
  { n: 'Sweet potato', kcal: 180, p: 4, c: 41, f: 0, emoji: '🍠' },
  { n: 'Whole eggs (2)', kcal: 156, p: 12, c: 1, f: 11, emoji: '🥚' },
  { n: 'Oatmeal', kcal: 150, p: 5, c: 27, f: 3, emoji: '🥣' },
  { n: 'Almonds (15g)', kcal: 130, p: 5, c: 5, f: 11, emoji: '🥜' },
  { n: 'Apple', kcal: 95, p: 0, c: 25, f: 0, emoji: '🍎' },
  { n: 'Avocado (half)', kcal: 160, p: 2, c: 9, f: 15, emoji: '🥑' },
  { n: 'Cottage cheese', kcal: 120, p: 14, c: 5, f: 5, emoji: '🧀' },
  { n: 'Peanut butter (1 tbsp)', kcal: 95, p: 4, c: 3, f: 8, emoji: '🥜' },
  { n: 'Mixed salad', kcal: 90, p: 3, c: 10, f: 5, emoji: '🥗' },
  { n: 'Turkey sandwich', kcal: 320, p: 24, c: 34, f: 9, emoji: '🥪' },
  { n: 'Orange juice', kcal: 110, p: 2, c: 26, f: 0, emoji: '🧃' },
  { n: 'Dark chocolate (20g)', kcal: 120, p: 2, c: 9, f: 9, emoji: '🍫' },
];

// ── History datasets (Daily / Weekly / Monthly period toggle) ───
export const HISTORY = {
  Daily: {
    calories: { avg: 2140, note: 'under goal', data: [420, 740, 210, 0, 770, 0, 0], labels: ['B', 'L', 'S', '—', 'D', '—', '—'], highlight: 4 },
    protein: { avg: 118, data: [28, 60, 30, 0, 50, 0, 0], labels: ['B', 'L', 'S', '—', 'D', '—', '—'], highlight: 1 },
    workouts: { count: 1, streak: 1, dots: [0, 0, 0, 0, 0, 0, 1], labels: WEEK_LABELS },
  },
  Weekly: {
    calories: { avg: 2193, note: 'under goal 6/7 days', data: CALORIE_WEEK, labels: WEEK_LABELS, highlight: 4 },
    protein: { avg: 138, data: PROTEIN_WEEK, labels: WEEK_LABELS, highlight: 4 },
    workouts: { count: 4, streak: 4, dots: [1, 1, 1, 1, 0, 1, 0], labels: WEEK_LABELS },
  },
  Monthly: {
    calories: { avg: 2210, note: 'steady', data: [2240, 2180, 2260, 2160], labels: ['W1', 'W2', 'W3', 'W4'], highlight: 2 },
    protein: { avg: 142, data: [136, 140, 148, 144], labels: ['W1', 'W2', 'W3', 'W4'], highlight: 2 },
    workouts: { count: 16, streak: 4, dots: [1, 1, 1, 1], labels: ['W1', 'W2', 'W3', 'W4'] },
  },
};

// ── Assistant: keyword matcher over the canned answer bank ──────
// Free-form questions no longer fall through to a single generic deflection — we match
// on keywords so natural phrasings ("how's my training going?") hit a real answer.
export const ASSISTANT_FALLBACK = {
  text: "I can pull from every Forge module to answer that. Right now Health is your most active module — try asking about calories, protein, workouts, weight, spending, or a weekly summary.",
  sources: ['Forge · All modules'],
};
const ANSWER_KEYS = [
  { q: 'How many calories did I eat this week?', kw: ['calorie', 'ate', 'eat', 'kcal', 'food this week'] },
  { q: 'How consistent have I been with workouts?', kw: ['workout', 'train', 'consistent', 'gym', 'session', 'streak'] },
  { q: 'How much did I spend eating out?', kw: ['spend', 'spent', 'money', 'eating out', 'dining', 'budget', 'cost'] },
  { q: 'Summarize my week', kw: ['summar', 'overview', 'recap', 'how am i doing', 'my week', 'weekly'] },
];
export function matchAnswer(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return null;
  if (ASSISTANT_ANSWERS[query]) return ASSISTANT_ANSWERS[query];
  const hit = ANSWER_KEYS.find(a => a.kw.some(k => q.includes(k)));
  if (hit) return ASSISTANT_ANSWERS[hit.q];
  return ASSISTANT_FALLBACK;
}
// follow-up chips shown after an answer
export const FOLLOW_UPS = [
  'How consistent have I been with workouts?',
  'Summarize my week',
  'How much did I spend eating out?',
];
