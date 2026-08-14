#!/usr/bin/env bash
# Full production deploy: API + prototype frontend.
# Must be run from the dedicated main worktree (see prototype/CLAUDE.md and
# api/README.md) — refuses to run anywhere not on `main`.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

./scripts/require-main-branch.sh
git pull --ff-only origin main

echo "==> api"
(cd api && npm install && npm run build)
systemctl restart forge-api

echo "==> prototype"
(cd prototype && npm install && npm run deploy)

echo "Deployed $(git rev-parse --short HEAD)"
