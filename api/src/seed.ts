// Seed a freshly-created user with the ForgeOS demo dataset, so signup opens onto a
// populated app (mirrors the old client-side seedState in prototype/src/data.js).
import { PoolClient } from 'pg';
import { dayFor, ensureDayMeals, CANONICAL_MEALS } from './lib';

const DEFAULT_SETTINGS = {
  goals: { weight: 72.0, protein: 160, calories: 2400, bodyfat: 15.0, waist: 78 },
  preferences: { units: 'Metric', currency: 'INR' },
  notifications: { workouts: true, meals: true, insights: true, water: false },
};

// Demo meals for "today" (name -> items). Matches data.js MEALS.
const DEMO_MEALS: Record<string, { n: string; kcal: number; p: number; c: number; f: number; emoji: string }[]> = {
  Breakfast: [
    { n: 'Greek yogurt bowl', kcal: 280, p: 22, c: 30, f: 8, emoji: '🥣' },
    { n: 'Black coffee', kcal: 5, p: 0, c: 1, f: 0, emoji: '☕' },
    { n: 'Banana', kcal: 105, p: 1, c: 27, f: 0, emoji: '🍌' },
    { n: 'Almonds (15g)', kcal: 130, p: 5, c: 5, f: 11, emoji: '🥜' },
  ],
  Lunch: [
    { n: 'Grilled chicken', kcal: 330, p: 52, c: 0, f: 12, emoji: '🍗' },
    { n: 'Brown rice', kcal: 240, p: 5, c: 50, f: 2, emoji: '🍚' },
    { n: 'Mixed salad', kcal: 90, p: 3, c: 10, f: 5, emoji: '🥗' },
    { n: 'Olive oil', kcal: 80, p: 0, c: 0, f: 9, emoji: '🫒' },
  ],
  Snack: [
    { n: 'Protein shake', kcal: 160, p: 30, c: 6, f: 2, emoji: '🥤' },
    { n: 'Apple', kcal: 50, p: 0, c: 13, f: 0, emoji: '🍎' },
  ],
  Dinner: [
    { n: 'Salmon fillet', kcal: 360, p: 40, c: 0, f: 22, emoji: '🐟' },
    { n: 'Sweet potato', kcal: 180, p: 4, c: 41, f: 0, emoji: '🍠' },
    { n: 'Broccoli', kcal: 55, p: 4, c: 11, f: 1, emoji: '🥦' },
    { n: 'Greens', kcal: 75, p: 2, c: 8, f: 4, emoji: '🥬' },
  ],
};

// data.js WEIGHT_SERIES / BODYFAT_SERIES / waist series — spread over prior weeks.
const WEIGHT_SERIES = [76.1, 75.8, 75.9, 75.4, 75.0, 74.9, 74.6, 74.7, 74.3, 74.2];
const BODYFAT_SERIES = [19.2, 18.9, 18.6, 18.4, 18.0, 17.7, 17.5, 17.2];
const WAIST_SERIES = [85, 84, 84, 83, 82, 82, 81, 81];

// Insert a body-measurement series ending today, one point every 7 days back.
async function seedMetric(c: PoolClient, userId: string, tz: string, metric: string, series: number[]) {
  const n = series.length;
  for (let i = 0; i < n; i++) {
    const daysAgo = (n - 1 - i) * 7;
    const at = new Date(Date.now() - daysAgo * 86400_000);
    await c.query(
      `insert into body_measurements (user_id, metric, value, day, logged_at)
       values ($1, $2, $3, $4, $5)`,
      [userId, metric, series[i], dayFor(tz, at), at],
    );
  }
}

export async function seedUser(c: PoolClient, userId: string, tz: string): Promise<void> {
  const today = dayFor(tz);

  await c.query(
    `insert into user_settings (user_id, goals, preferences, notifications)
     values ($1, $2, $3, $4)
     on conflict (user_id) do nothing`,
    [userId, DEFAULT_SETTINGS.goals, DEFAULT_SETTINGS.preferences, DEFAULT_SETTINGS.notifications],
  );

  await ensureDayMeals(c, userId, today);
  for (const { name } of CANONICAL_MEALS) {
    const meal = await c.query('select id from meals where user_id=$1 and day=$2 and name=$3', [userId, today, name]);
    const mealId = meal.rows[0].id;
    for (const it of DEMO_MEALS[name] || []) {
      await c.query(
        `insert into food_items (meal_id, name, kcal, p, c, f, emoji)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [mealId, it.n, it.kcal, it.p, it.c, it.f, it.emoji],
      );
    }
  }

  await seedMetric(c, userId, tz, 'weight', WEIGHT_SERIES);
  await seedMetric(c, userId, tz, 'bodyfat', BODYFAT_SERIES);
  await seedMetric(c, userId, tz, 'waist', WAIST_SERIES);

  // a couple of non-nutrition activities + today's baseline water/steps
  await c.query(`insert into water_logs (user_id, ml, day) values ($1, 1800, $2)`, [userId, today]);
  await c.query(
    `insert into walks (user_id, km, min, kcal, steps, day) values ($1, 2.4, 28, 142, 3120, $2)`,
    [userId, today],
  );
  await c.query(
    `insert into workouts (user_id, name, mins, sets, exercises, kcal, day) values ($1, 'Push', 52, 14, 5, 416, $2)`,
    [userId, today],
  );
}
