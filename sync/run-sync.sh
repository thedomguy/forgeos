#!/bin/bash
# launchd wrapper for forge-notes-sync.
#
# launchd starts jobs with a minimal environment, and asdf's `node` shim execs
# `asdf` from PATH — so invoking the shim directly fails with "asdf: not found".
# Rather than hardcoding a versioned node path (which breaks on every asdf
# upgrade), put asdf and its shims on PATH here and let the shim resolve the
# current version itself.
export PATH="/opt/homebrew/bin:$HOME/.asdf/shims:/usr/local/bin:/usr/bin:/bin"
exec node "$(dirname "$0")/forge-notes-sync.mjs" "$@"
