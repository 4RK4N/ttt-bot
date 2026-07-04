#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PARALLEL="${COMPOSE_PARALLEL_LIMIT:-1}"

# Always --no-cache: layer cache has produced stale HTML/CSS/JS in practice.
# npm + Astro image caches are handled separately via BuildKit cache mounts.
# Bot + editor share one builder stage (single compose build); website is separate.
docker compose --parallel "$PARALLEL" build --no-cache ttt-discord-bot ttt-web-editor
docker compose --parallel "$PARALLEL" build --no-cache ttt-website
docker compose up -d --force-recreate
