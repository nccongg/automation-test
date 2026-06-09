# Migration Order

## Fresh database setup

Run **`migrate-production.sh`** from the project root. It applies `Automation_testing_DB.sql`
(schema-only, COPY data blocks are stripped) as the complete base schema.

The old `001`–`012` incremental files are **superseded** by the dump — do not run them on a
fresh database.

## Adding new migrations

Place new files in this directory as `013_<description>.sql`, `014_…`, etc., then add a
`run_migration` call at the bottom of `migrate-production.sh`.

All new migrations should use `IF NOT EXISTS` / `IF EXISTS` guards so they are safe to re-run.

## Upgrading an existing database

If the target database was provisioned with the old incremental chain (001–012) and is missing
tables, reset the schema and re-run `migrate-production.sh`:

```sql
-- Run on the target DB first (DROPS ALL DATA)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

```bash
DATABASE_URL="postgresql://..." ./migrate-production.sh
```
