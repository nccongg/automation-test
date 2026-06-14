-- Resync every sequence in public to MAX(id) of its owning table/column.
--
-- Automation_testing_DB.sql (the base schema dump) contains stale
-- `SELECT pg_catalog.setval(...)` calls captured at dump time. Re-running
-- migrate-production.sh against a live database re-applies those stale
-- values and can rewind sequences behind the current MAX(id), causing
-- "duplicate key value violates unique constraint ..._pkey" on the next
-- insert. Safe to run any number of times.
DO $$
DECLARE
    rec RECORD;
    max_id BIGINT;
BEGIN
    FOR rec IN
        SELECT seq_ns.nspname AS seq_schema, seq.relname AS seq_name,
               tbl.relname AS table_name, col.attname AS col_name
        FROM pg_class seq
        JOIN pg_namespace seq_ns ON seq_ns.oid = seq.relnamespace
        JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
        JOIN pg_class tbl ON tbl.oid = dep.refobjid
        JOIN pg_attribute col ON col.attrelid = tbl.oid AND col.attnum = dep.refobjsubid
        WHERE seq.relkind = 'S' AND seq_ns.nspname = 'public'
    LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', rec.col_name, rec.seq_schema, rec.table_name) INTO max_id;
        IF max_id > 0 THEN
            EXECUTE format('SELECT setval(%L, %s, true)', format('%I.%I', rec.seq_schema, rec.seq_name), max_id);
        END IF;
    END LOOP;
END $$;
