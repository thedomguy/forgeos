# Forge OS API

Round-2 backend for ForgeOS: Express + TypeScript + self-hosted Postgres, JWT-in-httpOnly-cookie
auth. Runs on `127.0.0.1:3001`, proxied by nginx at `https://domguy.dev/api/v1/` (same-origin
as the Vite SPA at `domguy.dev/prototypes/forgeos/`, so no CORS/cross-site cookie is needed in
prod). Port 3000 was already in use by an unrelated service on this VPS, hence 3001 + a path
prefix instead of a `api.` subdomain.

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
Deployed as `/etc/systemd/system/forge-api.service` (not in this repo — lives only on the VPS):
```ini
[Unit]
Description=Forge OS API
After=network.target postgresql.service

[Service]
WorkingDirectory=/root/workspace/forgeos/api
ExecStart=/root/.local/share/mise/installs/node/24.18.0/bin/node dist/index.js
EnvironmentFile=/root/workspace/forgeos/api/.env
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```
Runs as `root` (not `www-data`) because the repo lives under `/root`, which is mode `700` and
unreadable by other users. `npm run build` first, then `systemctl daemon-reload && systemctl
enable --now forge-api`. Redeploy = `npm run build && systemctl restart forge-api`.

## nginx
Port 3000 was already taken by an unrelated existing service, so ForgeOS uses **3001 + a path
prefix** instead of its own subdomain — this avoids a second TLS cert and keeps the API
same-origin with the SPA (simpler cookies, no CORS). Added to the existing
`/etc/nginx/sites-available/domguy.dev` (443 server block), *before* the catch-all `location /`:
```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:3001/api/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
`api.domguy.dev` (the pre-existing site on port 3000) is unrelated infra — left untouched.

## Frontend env
The SPA reads `VITE_API_URL`, defaulting to the relative path `/api/v1` (same-origin in prod).
For local dev against a local API, create `prototype/.env.local` with
`VITE_API_URL=http://localhost:3001/api/v1` — cross-origin cookies to `localhost` need the
API's `NODE_ENV` unset (Secure=false) and `COOKIE_DOMAIN` empty.
