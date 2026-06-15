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
# STRATEGY:
#   1. Apply Automation_testing_DB.sql (DDL only) as the base schema.
#      This covers migrations 001–003 plus extra tables not in the migration chain.
#      001/002/003 have no IF NOT EXISTS so they cannot be re-run safely.
#   2. Run migrations 004–012 on top (all use IF NOT EXISTS / IF EXISTS guards).
#
# FRESH SETUP:
#   Reset the DB first, then run this script:
#     psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

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

run_migration() {
  local file="$1"
  local label="$2"
  echo -n "  ▶ $label ... "
  psql "$DATABASE_URL" -f "$file" --quiet 2>&1 | tail -5
  echo "  ✅ done"
}

# ── Step 1: Base schema (covers 001–003 + extra tables) ───────────────────────
echo "  ▶ Base schema (Automation_testing_DB.sql, schema-only) ..."
awk '/^COPY /,/^\\.$/{ next } 1' "$BASE_SCHEMA" | psql "$DATABASE_URL" --quiet 2>&1 | tail -5
echo "  ✅ Base schema done"
echo ""

# ── Step 2: Incremental migrations on top of base dump ────────────────────────
# 001 and 002 are fully covered by the dump.
# 003 creates test_run_batches + batch_id on test_runs — not in the dump.
run_migration "$MIGRATIONS_DIR/003_batch_runs.sql"                    "003_batch_runs"
run_migration "$MIGRATIONS_DIR/004_failure_taxonomy.sql"              "004_failure_taxonomy"
run_migration "$MIGRATIONS_DIR/add_test_collections.sql"              "add_test_collections"
run_migration "$MIGRATIONS_DIR/005_collection_hierarchy.sql"          "005_collection_hierarchy"
run_migration "$MIGRATIONS_DIR/006_add_pass_with_warning_verdict.sql" "006_pass_with_warning_verdict"
run_migration "$MIGRATIONS_DIR/007_add_is_ai_draft.sql"               "007_add_is_ai_draft"
run_migration "$MIGRATIONS_DIR/008_add_anchor_results.sql"            "008_add_anchor_results"
run_migration "$MIGRATIONS_DIR/009_ai_generation_persistence.sql"     "009_ai_generation_persistence"
run_migration "$MIGRATIONS_DIR/009_test_objects.sql"                  "009_test_objects"
run_migration "$MIGRATIONS_DIR/010_test_objects_katalon_schema.sql"   "010_test_objects_katalon_schema"
run_migration "$MIGRATIONS_DIR/011_test_objects_fix_constraints.sql"  "011_test_objects_fix_constraints"
run_migration "$MIGRATIONS_DIR/012_ai_analysis_persistence.sql"       "012_ai_analysis_persistence"

run_migration "$MIGRATIONS_DIR/013_create_test_suites.sql"            "013_create_test_suites"
run_migration "$MIGRATIONS_DIR/add_suite_run_item_execution_metadata.sql" "add_suite_run_item_execution_metadata"
run_migration "$MIGRATIONS_DIR/014_fix_dataset_bindings_columns.sql"  "014_fix_dataset_bindings_columns"
run_migration "$MIGRATIONS_DIR/015_add_evidence_file_data.sql"        "015_add_evidence_file_data"
run_migration "$MIGRATIONS_DIR/016_add_test_run_dataset_bindings_columns.sql" "016_add_test_run_dataset_bindings_columns"
run_migration "$MIGRATIONS_DIR/017_add_test_suite_runs_ai_analysis.sql"       "017_add_test_suite_runs_ai_analysis"

# ── Add new migrations here as the schema evolves ────────────────────────────

# ── Step 3: Resync sequences ──────────────────────────────────────────────────
# Step 1 re-applies stale `setval(...)` calls from the dump, which can rewind
# sequences behind the live MAX(id) on a re-run. Always fix up afterwards.
run_migration "$MIGRATIONS_DIR/fix_sequences.sql"                     "fix_sequences"

echo ""
echo "✅  All migrations completed successfully."
