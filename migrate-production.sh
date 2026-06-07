#!/usr/bin/env bash
# migrate-production.sh
# Run all database migrations in the correct order against a PostgreSQL database.
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
#   ./migrate-production.sh
#
#   OR pass directly:
#   DATABASE_URL="postgresql://..." ./migrate-production.sh

set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "$0")/server/migrations" && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set."
  echo "    Export it before running: export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo "🗄️  Running migrations against: ${DATABASE_URL%%@*}@***"
echo "    Migrations dir: $MIGRATIONS_DIR"
echo ""

run_migration() {
  local file="$1"
  local label="$2"
  echo -n "  ▶ $label ... "
  psql "$DATABASE_URL" -f "$file" --quiet 2>&1 | tail -5
  echo "✅ done"
}

# ── Ordered migration list ────────────────────────────────────────────────────
run_migration "$MIGRATIONS_DIR/001_init.sql"                          "001_init"
run_migration "$MIGRATIONS_DIR/002_test_sheets.sql"                   "002_test_sheets"
run_migration "$MIGRATIONS_DIR/003_batch_runs.sql"                    "003_batch_runs"
run_migration "$MIGRATIONS_DIR/004_failure_taxonomy.sql"              "004_failure_taxonomy"
run_migration "$MIGRATIONS_DIR/add_test_collections.sql"              "add_test_collections (before 005)"
run_migration "$MIGRATIONS_DIR/005_collection_hierarchy.sql"          "005_collection_hierarchy"
run_migration "$MIGRATIONS_DIR/006_add_pass_with_warning_verdict.sql" "006_pass_with_warning_verdict"
run_migration "$MIGRATIONS_DIR/007_add_is_ai_draft.sql"               "007_add_is_ai_draft"
run_migration "$MIGRATIONS_DIR/008_add_anchor_results.sql"            "008_add_anchor_results"
run_migration "$MIGRATIONS_DIR/009_ai_generation_persistence.sql"     "009_ai_generation_persistence"
run_migration "$MIGRATIONS_DIR/009_test_objects.sql"                  "009_test_objects"
run_migration "$MIGRATIONS_DIR/010_test_objects_katalon_schema.sql"   "010_test_objects_katalon_schema"
run_migration "$MIGRATIONS_DIR/011_test_objects_fix_constraints.sql"  "011_test_objects_fix_constraints"
run_migration "$MIGRATIONS_DIR/012_ai_analysis_persistence.sql"       "012_ai_analysis_persistence"

echo ""
echo "✅  All migrations completed successfully."
