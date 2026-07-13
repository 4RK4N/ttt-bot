#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
  cat >&2 <<EOF
Usage: $0 [--dry-run] [--force]

One-time JSON → PostgreSQL cutover (runs in ttt-discord-bot container).

  --dry-run   Parse + merge + print plan; no SQL, no file renames
  --force     Overwrite existing DB rows (default: abort if tables non-empty)

Requires ttt-postgres healthy, schema applied (./scripts/db-init.sh), and a
built bot image (./scripts/build.sh bot).
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

ROOT="$(pwd)"
docker compose run --rm --no-deps \
  -v "${ROOT}:/host:rw" \
  -e TTT_BACKUP_DIR=/host \
  ttt-discord-bot node dist/scripts/db-migrate.js "$@"
