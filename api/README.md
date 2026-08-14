# Forge OS API

Round-2 backend for ForgeOS: Express + TypeScript + self-hosted Postgres, JWT-in-httpOnly-cookie
auth. Runs on `127.0.0.1:3001`, proxied by nginx at `https://api.domguy.dev/fg/v1/` — `fg` is
ForgeOS's service prefix on the shared `api.domguy.dev` host; other backends can land alongside
it later under their own `/xx/v1` prefix on the same site, no new subdomain or cert per service.
This makes the SPA (`domguy.dev/prototypes/forgeos/`) call cross-origin, so CORS and a
host-only cookie on `api.domguy.dev` are required (see Frontend env below). Port 3000 was
already in use by an unrelated legacy service on this VPS, hence 3001.

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
WorkingDirectory=/root/workspace/forgeos-main/api
ExecStart=/root/.local/share/mise/installs/node/24.18.0/bin/node dist/index.js
EnvironmentFile=/root/workspace/forgeos-main/api/.env
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```
Runs as `root` (not `www-data`) because the repo lives under `/root`, which is mode `700` and
unreadable by other users. `WorkingDirectory` points at `/root/workspace/forgeos-main` — the
dedicated `main`-branch git worktree (see repo-root `deploy.sh`), never a feature-branch
checkout. `npm run build` first, then `systemctl daemon-reload && systemctl enable --now
forge-api`. Redeploy from the main worktree = `npm run deploy` (equivalent to `npm run build &&
systemctl restart forge-api`, but refuses to run off `main`) or, for a full API+frontend deploy,
`../deploy.sh` from the repo root.

## nginx
Port 3000 was already taken by an unrelated legacy service, so forge-api runs on **3001**, and
is exposed on the *existing* `api.domguy.dev` site behind a service-name prefix (`/fg/v1/`)
rather than its own subdomain — one shared host + cert can serve any number of future backends,
each getting its own prefix here. Added to
`/etc/nginx/sites-available/api.domguy.dev` (443 server block), *before* the catch-all
`location /` (which still goes to the legacy `:3000` service, untouched):
```nginx
location /fg/v1/ {
    proxy_pass http://127.0.0.1:3001/fg/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
`domguy.dev` (the SPA's site) has no API route at all now — it's back to serving only static
files.

## Frontend env
The SPA reads `VITE_API_URL`, defaulting to `https://api.domguy.dev/fg/v1` in prod — a genuine
cross-origin call from `domguy.dev`, so `CORS_ORIGIN` on the API must be `https://domguy.dev`
and the auth cookie stays host-only on `api.domguy.dev` (`COOKIE_DOMAIN` empty; `SameSite=Lax`
still works since both hosts share the registrable domain `domguy.dev`). For local dev against
a local API, create `prototype/.env.local` with `VITE_API_URL=http://localhost:3001/fg/v1` —
cross-origin cookies to `localhost` need the API's `NODE_ENV` unset (Secure=false) and
`COOKIE_DOMAIN` empty.
