# Migration Order

Run migrations against the production database in the following order.
All migrations use `IF NOT EXISTS` / `IF EXISTS` guards so they are safe to re-run.

| # | File | Description |
|---|------|-------------|
| 1 | `001_init.sql` | Base schema: users, sessions, projects, scans, test_cases, test_runs, results |
| 2 | `002_test_sheets.sql` | Test sheet / test suite support |
| 3 | `003_batch_runs.sql` | Batch test execution |
| 4 | `004_failure_taxonomy.sql` | Failure category labels |
| 5 | `add_test_collections.sql` | Base test_collections and test_collection_items tables (**must run before 005**) |
| 6 | `005_collection_hierarchy.sql` | Adds parent_id to test_collections for nested folder tree |
| 7 | `006_add_pass_with_warning_verdict.sql` | New verdict type: pass_with_warning |
| 8 | `007_add_is_ai_draft.sql` | AI-draft flag on test cases |
| 9 | `008_add_anchor_results.sql` | Anchor / element validation results |
| 10 | `009_ai_generation_persistence.sql` | AI generation batch columns |
| 11 | `009_test_objects.sql` | Object repository: reusable element definitions |
| 12 | `010_test_objects_katalon_schema.sql` | Katalon-style schema on test_objects |
| 13 | `011_test_objects_fix_constraints.sql` | Constraint fixes on test_objects |
| 14 | `012_ai_analysis_persistence.sql` | AI analysis storage |

## Notes

- Files `009_ai_generation_persistence.sql` and `009_test_objects.sql` share the same numeric prefix.
  Run `009_ai_generation_persistence.sql` first, then `009_test_objects.sql`.
- `add_test_collections.sql` has no numeric prefix but **must** run before `005_collection_hierarchy.sql`
  because 005 alters the `test_collections` table created by `add_test_collections.sql`.
- Use `migrate-production.sh` (project root) to run all migrations automatically in the correct order.
