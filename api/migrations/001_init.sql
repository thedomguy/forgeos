-- ForgeOS round-2 schema. Idempotent (safe to re-run).
create extension if not exists "pgcrypto";  -- gen_random_uuid()

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  name          text not null default 'Alex Morgan',
  tz            text not null default 'UTC',
  created_at    timestamptz not null default now()
);

create table if not exists user_settings (
  user_id       uuid primary key references users(id) on delete cascade,
  goals         jsonb not null default '{}'::jsonb,   -- {weight,protein,calories,bodyfat,waist,...}
  preferences   jsonb not null default '{}'::jsonb,   -- {units,currency}
  notifications jsonb not null default '{}'::jsonb    -- {workouts,meals,insights,water}
);

-- A meal is one row per (user, day, name). Canonical names: Breakfast/Lunch/Snack/Dinner.
create table if not exists meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  day        date not null,
  logged_at  timestamptz not null default now(),
  sort       int not null default 0,
  unique (user_id, day, name)
);
create index if not exists meals_user_day on meals(user_id, day);

create table if not exists food_items (
  id         uuid primary key default gen_random_uuid(),
  meal_id    uuid not null references meals(id) on delete cascade,
  name       text not null,
  kcal       numeric not null default 0,
  p          numeric not null default 0,
  c          numeric not null default 0,
  f          numeric not null default 0,
  emoji      text,
  logged_at  timestamptz not null default now()
);
create index if not exists food_items_meal on food_items(meal_id);

-- Unified body measurements. metric in ('weight','bodyfat','waist'). Weight drives today.weight.
create table if not exists body_measurements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  metric     text not null,
  value      numeric not null,
  day        date not null,
  logged_at  timestamptz not null default now()
);
create index if not exists body_meas_user_metric on body_measurements(user_id, metric, logged_at);

create table if not exists water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  ml         int not null,
  day        date not null,
  logged_at  timestamptz not null default now()
);
create index if not exists water_user_day on water_logs(user_id, day);

create table if not exists walks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  km         numeric not null default 0,
  min        int not null default 0,
  kcal       int not null default 0,
  steps      int not null default 0,
  day        date not null,
  logged_at  timestamptz not null default now()
);
create index if not exists walks_user_day on walks(user_id, day);

create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  mins        int not null default 0,
  sets        int not null default 0,
  exercises   int not null default 0,
  kcal        int not null default 0,
  day         date not null,
  finished_at timestamptz not null default now()
);
create index if not exists workouts_user_day on workouts(user_id, day);

-- Cross-module activity feed. One row per mutating action. Frontend maps kind -> {icon,hue}.
create table if not exists activities (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references users(id) on delete cascade,
  kind     text not null,                 -- food|weight|water|walk|workout
  module   text not null default 'health',
  title    text not null,
  sub      text not null default '',
  tag      text not null default '',
  at       timestamptz not null default now()
);
create index if not exists activities_user_at on activities(user_id, at desc);
