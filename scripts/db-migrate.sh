#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
  cat >&2 <<EOF
Usage: $0 [--dry-run] [--force]

One-time JSON → PostgreSQL cutover (runs on the host).

  --dry-run   Parse + merge + print plan; no SQL, no file renames
  --force     Overwrite existing DB rows (default: abort if tables non-empty)

Requires ttt-postgres healthy and schema applied (./scripts/db-init.sh).
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! docker compose exec -T ttt-postgres pg_isready -U ttt -d ttt >/dev/null 2>&1; then
  echo "PostgreSQL is not healthy. Start it with: docker compose up -d ttt-postgres" >&2
  exit 1
fi

node scripts/db-migrate.mjs "$@"
