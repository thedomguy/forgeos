# Forge OS Prototype

React + Vite prototype for ForgeOS.

## Commands

- `npm run dev` — local dev server (localhost only; not exposed on the network)
- `npm run build` — production build to `dist/`
- `npm run deploy` — build and publish to the live site in one step

## Live deployment

Published at **https://domguy.dev/prototypes/forgeos/**, served by the nginx site
`/etc/nginx/sites-available/domguy.dev` (root `/var/www/domguy.dev`), alongside other
prototypes under `/var/www/domguy.dev/prototypes/`.

`vite.config.js` sets `base: '/prototypes/forgeos/'` to match this subpath — required
for built asset URLs to resolve correctly. Update it if the deploy path ever changes.

`npm run deploy` is the whole flow: builds, copies `dist/*` into
`/var/www/domguy.dev/prototypes/forgeos/`, and fixes ownership to `www-data`. Run it
after any change you want visible on the live URL. There is no separate running dev
process on this VPS — deploy is build-and-copy only, nothing auto-publishes.

**Deploys must run from `main`, in the dedicated main worktree** at
`/root/workspace/forgeos-main` — `npm run deploy` (here and in `api/`) shells out to
`../scripts/require-main-branch.sh` first and refuses to run on any other branch. For a
full API + frontend deploy in one step, run `./deploy.sh` from that worktree's repo
root. Feature work happens in the regular checkout (e.g. `/root/workspace/forgeos`) on
whatever branch; only the main worktree ever ships to prod.

## PWA

Installable + offline via `vite-plugin-pwa` (config in `vite.config.js`), source icons
in `public/` generated from `mobile-app/assets/icon.png`. Service worker precaches the
app shell (`registerType: 'autoUpdate'`) — after deploying a change, installed clients
pick it up on next load/refresh, not instantly. Regenerate `public/pwa-*.png` /
`apple-touch-icon.png` / `favicon-32x32.png` with Pillow if the source icon changes.
