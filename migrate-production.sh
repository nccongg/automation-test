#!/usr/bin/env bash
# migrate-production.sh
# Sets up the database schema against a PostgreSQL database.
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
#   ./migrate-production.sh
#
#   OR pass directly:
#   DATABASE_URL="postgresql://..." ./migrate-production.sh
#
# NOTE: This script applies Automation_testing_DB.sql (schema-only) as the
# full base schema. The old 001–012 incremental migration files are superseded
# by this dump. Add new incremental migrations below the base schema step.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/server/migrations"
BASE_SCHEMA="$ROOT_DIR/Automation_testing_DB.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set."
  echo "    Export it before running: export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo "🗄️  Running migrations against: ${DATABASE_URL%%@*}@***"
echo ""

# ── Step 1: Apply full base schema (DDL only, skip COPY data blocks) ──────────
echo "  ▶ Base schema (Automation_testing_DB.sql, schema-only) ..."
awk '/^COPY /,/^\\.$/{ next } 1' "$BASE_SCHEMA" | psql "$DATABASE_URL" --quiet 2>&1 | tail -5
echo "  ✅ Base schema done"
echo ""

# ── Step 2: Incremental migrations added AFTER the base dump ─────────────────
# Add new migration files here as the schema evolves beyond Automation_testing_DB.sql

echo ""
echo "✅  All migrations completed successfully."
