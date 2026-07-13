#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -ne 1 ]]; then
  cat >&2 <<EOF
Usage: $0 scripts/db/migrations/002_description.sql

Applies an incremental SQL migration inside ttt-postgres.
EOF
  exit 1
fi

migration="$1"
if [[ ! -f "$migration" ]]; then
  echo "Migration file not found: $migration" >&2
  exit 1
fi

if ! docker compose exec -T ttt-postgres pg_isready -U ttt -d ttt >/dev/null 2>&1; then
  echo "PostgreSQL is not healthy. Start it with: docker compose up -d ttt-postgres" >&2
  exit 1
fi

echo "Applying $migration ..."
docker compose exec -T ttt-postgres psql -U ttt -d ttt -v ON_ERROR_STOP=1 -f - < "$migration"
echo "Done."
