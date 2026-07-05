#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Uncollapsed build logs (--progress is a global compose flag; forwarded to buildx bake).

cache_flag=()
if [[ "${NO_CACHE:-}" == "1" ]]; then
  cache_flag=(--no-cache)
fi

# Sequential equivalent of:
#   docker compose build && docker compose up -d --force-recreate
# Force a full rebuild: NO_CACHE=1 ./scripts/build.sh
compose=(
  docker compose
  --progress plain
  --ansi never
)

compose_build() {
  if "${compose[@]}" build "${cache_flag[@]}" "$@"; then
    return 0
  fi
  echo "Build failed, retrying once in 5s..." >&2
  sleep 5
  "${compose[@]}" build "${cache_flag[@]}" "$@"
}

# Bot + editor share deps in Dockerfile; one bake pass reuses npm ci.
compose_build ttt-discord-bot ttt-web-editor
compose_build ttt-website
docker compose up -d --force-recreate
