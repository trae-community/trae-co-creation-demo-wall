#!/bin/sh
set -e

if [ "${RUN_DB_INIT:-true}" = "true" ]; then
  echo "Waiting for database..."
  until node -e "require('net').createConnection({host:'db',port:5432}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; do
    sleep 1
  done

  echo "Database is ready!"

  echo "Running database migrations..."
  node node_modules/prisma/build/index.js db push

  echo "Seeding database..."
  node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "Seed failed or already completed"
fi

if [ "${START_SERVER:-true}" != "true" ]; then
  echo "Initialization completed, exiting without starting server."
  exit 0
fi

echo "Starting application..."
exec node server.js
