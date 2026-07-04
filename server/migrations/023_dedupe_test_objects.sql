-- Dedupe auto-detected test objects that point at the same element.
--
-- The agent used to mint suffixed names (`input_email_1`, `input_email_2`, ...)
-- when the same element was interacted with more than once in a run, so one
-- element could accumulate several rows per page. Keep one row per
-- (project, page, selector_collection) — preferring confirmed rows, then the
-- oldest — and drop the redundant auto rows. Replay scripts that still
-- reference a deleted name fall back to their baked-in `_selectorCollection`.
--
-- Safe to re-run: the DELETE simply matches nothing once duplicates are gone.

WITH ranked AS (
  SELECT
    id,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, COALESCE(page_key, ''), selector_collection
      ORDER BY (status = 'confirmed') DESC, id ASC
    ) AS rn
  FROM test_objects
)
DELETE FROM test_objects t
USING ranked r
WHERE t.id = r.id
  AND r.rn > 1
  AND t.status = 'auto';
