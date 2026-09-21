#!/bin/sh
set -eu
export DATA_DIR="${DATA_DIR:-/data}"
export NODE_ENV="${NODE_ENV:-production}"
mkdir -p "$DATA_DIR"

# Soft ensure-seed: never block boot if seed fails (empty volume, lock, etc.)
if [ -x ./node_modules/.bin/tsx ] || [ -f ./node_modules/tsx/dist/cli.mjs ]; then
  echo "[entrypoint] DATA_DIR=$DATA_DIR — running ensure-seed (soft)"
  ./node_modules/.bin/tsx scripts/ensure-seed.ts \
    || echo "[entrypoint] ensure-seed soft-failed; continuing to server"
else
  echo "[entrypoint] tsx not found; skipping ensure-seed"
fi

echo "[entrypoint] starting Next.js standalone on 0.0.0.0:${PORT:-3000}"
exec node server.js
