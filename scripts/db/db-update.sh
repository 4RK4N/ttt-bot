#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
DB_CLI="dist/scripts/db/cli.js"
SERVICE="ttt-discord-bot"

# shellcheck source=bot-node.sh
source "$(dirname "$0")/bot-node.sh"

usage() {
  cat >&2 <<EOF
Usage: $0 <migration.sql>

Apply an incremental SQL migration to data/ttt.db inside ttt-discord-bot.

Example:
  $0 scripts/db/migrations/001_drop_updated_at.sql

Requires a built bot image: ./scripts/build.sh bot
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

migration="${1:-}"
if [[ -z "$migration" || ! -f "$migration" ]]; then
  echo "Migration file not found: ${migration:-<missing>}" >&2
  usage
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "$DB_PATH not found. Run ./scripts/db/db-init.sh first." >&2
  exit 1
fi

echo "Applying $migration to $DB_PATH ..."
migration_abs="$(cd "$(dirname "$migration")" && pwd)/$(basename "$migration")"
bot_node_write_sql "$migration_abs" "$DB_CLI" apply-sql "$DB_PATH" /app/migration.sql
echo "Done."
