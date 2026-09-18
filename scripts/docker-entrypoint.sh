#!/bin/sh
set -eu

echo "Running database migrations…"
node ./scripts/migrate.mjs

echo "Starting Next.js server…"
exec node server.js
