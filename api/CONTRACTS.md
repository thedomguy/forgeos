# ForgeOS API — Contracts (round 2)

Source of truth for the parallel agents. Do not change these shapes without updating this file.

**Base URL:** `https://domguy.dev/api/v1` (prod, same-origin path proxied by nginx to the
API on `127.0.0.1:3001`) / `http://localhost:3001/api/v1` (dev). Routes below are shown
without the `/api/v1` prefix — it's mounted once in `app.ts`, not per-router.
**Auth:** JWT in an httpOnly cookie `forge_token`, set by `/auth/*`. All non-`/auth` routes
require it (`authRequired` sets `req.user = { id, email, name, tz }`). Frontend must send
`credentials: 'include'` on every request.
**Errors:** non-2xx returns `{ "error": string, "details"?: any }`. Throw `HttpError(status,msg)`
or a `ZodError` (auto-mapped to 400) — never hand-roll status codes in handlers.
**Money/format note:** all `kcal/p/c/f/kg/ml/km` are numbers. Server never sends design tokens
(color/icon/hue/label/unit) — the frontend owns those.

Shared helpers (already implemented in `src/`): `h()` async wrapper, `HttpError`,
`dayFor(tz)`→'YYYY-MM-DD', `hhmm(tz)`→'HH:MM', `ensureDayMeals`, `writeActivity`, `round1`,
`query/one/tx` (db). `req.user` is guaranteed on all routes below.

---

## GET /state  (State agent — `routes/state.ts`)
Query: `?day=YYYY-MM-DD` optional; default = `dayFor(req.user.tz)`.
Must call `ensureDayMeals(pool, userId, day)` first so the 4 canonical meals always exist.

Returns exactly:
```jsonc
{
  "today": {
    "caloriesGoal": 2400,        // settings.goals.calories
    "caloriesOut": 620,          // sum(walks.kcal)+sum(workouts.kcal) for the day
    "water": { "v": 1.8, "goal": 3.0 },   // v = sum(water.ml)/1000 rounded1; goal fixed 3.0
    "steps": 7820,               // sum(walks.steps) for the day
    "stepsGoal": 10000,          // fixed 10000
    "weight": 74.2,              // latest body_measurements weight value (any day)
    "weightGoal": 72.0           // settings.goals.weight
  },
  "macros": { "protein": 118, "carbs": 210, "fat": 64 },  // sum of food_items p/c/f for the day
  "meals": [                     // ordered by meals.sort, then logged_at
    { "id": "uuid", "meal": "Breakfast", "time": "08:10", "kcal": 520,
      "items": [ { "n": "Greek yogurt bowl", "kcal": 280, "p": 22, "c": 30, "f": 8, "emoji": "🥣" } ] }
  ],
  "weight": {                    // metric='weight' series, chronological
    "series": [76.1, 74.2], "dates": ["Apr 1", "Jun 3"],   // dates = 'Mon D' from logged_at
    "current": 74.2, "goal": 72.0, "start": 76.1
  },
  "bodyMetrics": [               // dynamic only; frontend merges label/unit/color by key
    { "key": "weight",  "v": 74.2, "delta": -1.9, "series": [/* numbers */], "goal": 72.0 },
    { "key": "bodyfat", "v": 17.2, "delta": -2.0, "series": [/* numbers */], "goal": 15.0 },
    { "key": "waist",   "v": 81,   "delta": -3,   "series": [/* numbers */], "goal": 78 }
  ],
  "timeline": [ /* same shape as GET /timeline items, newest first, capped ~50 */ ],
  "settings": {
    "goals": { "weight": 72.0, "protein": 160, "calories": 2400, "bodyfat": 15.0, "waist": 78 },
    "preferences": { "units": "Metric", "currency": "INR" },
    "notifications": { "workouts": true, "meals": true, "insights": true, "water": false }
  }
}
```
`delta` = latest value − first value in that metric's series (round1). `time` per meal = `hhmm`
of its earliest food_item, else the meal's own `logged_at`.

## GET /timeline  (State agent — `routes/timeline.ts`)
Query: `?module=all|health|finance|...` (default all). Newest first.
```jsonc
[ { "id": "uuid", "t": "20:15", "module": "health", "kind": "food",
    "title": "Dinner logged", "sub": "Salmon, sweet potato · 670 kcal", "tag": "Nutrition" } ]
```
`t` = `hhmm(req.user.tz, at)`. `kind` ∈ food|weight|water|walk|workout (frontend maps kind→icon/hue).

---

## Meals  (Nutrition agent — `routes/meals.ts`)  — mount base `/meals`
All operate only on meals owned by `req.user.id` (404 otherwise). After any change,
call `writeActivity`. Each endpoint returns the updated meal object (same shape as a
`/state` meals[] entry) so the store can reconcile.

- `POST /`  body `{ name: string, day?: 'YYYY-MM-DD' }` → create custom meal (or 409 if name
  exists that day). Returns `{ meal }`.
- `POST /:id/items`  body `{ items: [{ n, kcal, p, c, f, emoji? }] }` → append; recompute kcal.
  `writeActivity(kind:'food', title:'<MealName> logged', sub:'<firstItem>[ +N more] · <sumKcal> kcal', tag:'Nutrition')`.
  Returns `{ meal }`.
- `PATCH /:id/items/:i`  body `{ patch: {...partial item...} }` (i = 0-based index) → returns `{ meal }`.
- `DELETE /:id/items/:i` → returns `{ meal }`. (No activity row for edit/delete.)

## Activity logs  (Activity agent — `routes/log.ts`)  — mounted at root
Each inserts a row, writes an activity, returns `{ ok: true, entry }` where `entry` is the
new timeline item (so the store can prepend it). Use `dayFor(req.user.tz)`.

- `POST /weight`  `{ kg: number }` → body_measurements(metric='weight'). activity kind='weight',
  title:'Weight updated', sub:`<kg.toFixed(1)> kg · <±delta from prev> from last`, tag:'Body'.
- `POST /water`  `{ ml: number }` → activity kind='water', sub:`+<ml> ml · <todayL> L today`, tag:'Hydration'.
- `POST /walks`  `{ km, min, kcal, steps? }` (steps default round(km*1300)) → kind='walk',
  title:'Walk tracked', sub:`<km> km · <min> min · <kcal> kcal`, tag:'Activity'.
- `POST /workouts`  `{ name, mins, sets, exercises, kcal? }` (kcal default round(mins*8)) →
  kind='workout', title:`<name> workout completed`, sub:`<mins> min · <exercises> exercises · <sets> sets`, tag:'Training'.

## Settings  (Activity agent — `routes/settings.ts`)  — mount base `/settings`
Merge (never replace) the jsonb column; return the merged object.
- `PATCH /goals` `{ patch: {...} }` → `{ goals }`
- `PATCH /preferences` `{ patch: {...} }` → `{ preferences }`
- `PATCH /notifications` `{ patch: {...} }` → `{ notifications }`  (frontend sends the whole
  toggled map or a single `{ key: bool }` — merge either way).

---

## Frontend migration  (Frontend agent — `prototype/src/`)
Goal: replace localStorage persistence with the API, keeping the reducer for **optimistic UI**.

1. New `prototype/src/api.js`: a `fetch` wrapper with `credentials:'include'`, JSON, base URL
   from `import.meta.env.VITE_API_URL || 'https://api.domguy.dev'`, throws on non-2xx.
2. `store.jsx`:
   - Drop the localStorage read/write of app state (keep theme/dark/accent/workout in localStorage
     as-is — those stay client-only).
   - On mount: `GET /auth/me`; if 200 → `GET /state` and hydrate; else show login.
   - Each `actions.*` becomes: dispatch the existing optimistic reducer case immediately, then
     call the API; on success reconcile with the server response, on failure roll back + toast.
   - `login/signup/logout` call `/auth/*` then hydrate/clear.
   - `useMacros` already merges static tokens; change `useBodyMetrics` to merge static
     label/unit/color from `data.js` BODY_METRICS with the dynamic `{v,delta,series,goal}` by `key`.
   - Timeline items: add a `kind → {icon,hue,accentRow}` map (workout ⇒ accentRow:true) so
     render keeps working from the token-free server rows.
3. `login.jsx`: wire real signup/login; surface API errors.

Keep all screen components unchanged.
