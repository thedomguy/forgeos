#!/usr/bin/env bash
# Refuses to continue unless the calling repo/worktree is on `main`.
# Deploys must run from the dedicated main worktree, never a feature branch —
# see /deploy.sh and prototype/CLAUDE.md.
set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "main" ]; then
  echo "Refusing to deploy: on branch '$branch', not 'main'." >&2
  echo "Run deploys from the dedicated main worktree (see /deploy.sh)." >&2
  exit 1
fi
