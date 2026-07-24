# Forge OS API

Round-2 backend for ForgeOS: Express + TypeScript + self-hosted Postgres, JWT-in-httpOnly-cookie
auth. Serves `api.domguy.dev`; the Vite SPA at `domguy.dev/prototypes/forgeos/` talks to it.

See `CONTRACTS.md` for the full endpoint spec.

## Layout
- `src/app.ts` — Express app: CORS (credentials), cookie-parser, routers, error handler
- `src/auth.ts` — bcrypt + JWT cookie, `authRequired` guard
- `src/db.ts` — `pg` pool + `query/one/tx` helpers
- `src/lib.ts` — `dayFor`/`hhmm` (per-user tz), `ensureDayMeals`, `writeActivity`, `HttpError`, `h`
- `src/seed.ts` — populates a new user with the demo dataset on signup
- `src/routes/*` — `auth`, `state`, `meals`, `log` (weight/water/walks/workouts), `settings`, `timeline`
- `migrations/*.sql` — forward-only, run by `npm run migrate`

## Local / VPS setup (the gated infra step)

1. **Install Postgres** (VPS, once):
   ```sh
   sudo apt update && sudo apt install -y postgresql
   ```
   It binds to `127.0.0.1:5432` by default — do NOT expose it publicly (no new ufw rule).

2. **Create role + database:**
   ```sh
   # edit the password in the file first, then:
   sudo -u postgres psql -f api/scripts/setup-db.sql
   ```

3. **Configure env:**
   ```sh
   cp .env.example .env
   # set DATABASE_URL (matching the password), a long random JWT_SECRET,
   # CORS_ORIGIN=https://domguy.dev, COOKIE_DOMAIN=.domguy.dev, NODE_ENV=production
   ```

4. **Migrate + run:**
   ```sh
   npm install
   npm run migrate
   npm run dev      # dev (tsx watch)
   # prod: npm run build && npm start
   ```

## Run as a service (prod)
Example systemd unit (`/etc/systemd/system/forge-api.service`):
```ini
[Unit]
Description=Forge OS API
After=network.target postgresql.service

[Service]
WorkingDirectory=/root/workspace/forgeos/api
ExecStart=/usr/bin/node dist/index.js
EnvironmentFile=/root/workspace/forgeos/api/.env
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```
`npm run build` first, then `systemctl enable --now forge-api`.

## nginx
`api.domguy.dev` already reverse-proxies to `127.0.0.1:3000` (existing infra). Confirm the
`server_name api.domguy.dev` block forwards `/` to `http://127.0.0.1:3000` and passes
`proxy_set_header Host $host` (needed for the cookie domain). No new ports are opened.

## Frontend env
The SPA reads `VITE_API_URL` (defaults to `https://api.domguy.dev`). For local dev against a
local API, create `prototype/.env.local` with `VITE_API_URL=http://localhost:3000` — but note
cross-origin cookies to `localhost` need the API's `NODE_ENV` unset (Secure=false) and
`COOKIE_DOMAIN` empty.
