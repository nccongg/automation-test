-- Evolve test_objects to Katalon-inspired schema
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS selector_method       VARCHAR(50)  DEFAULT 'xpath',
  ADD COLUMN IF NOT EXISTS selector_collection   JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS element_properties    JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_properties   JSONB        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS parent_frame_object_id INTEGER     REFERENCES test_objects(id),
  ADD COLUMN IF NOT EXISTS source_url            TEXT,
  ADD COLUMN IF NOT EXISTS status                VARCHAR(20)  DEFAULT 'auto'
    CHECK (status IN ('auto', 'confirmed'));

-- Migrate existing selectors array → selector_collection dict + selector_method
UPDATE test_objects
SET
  selector_collection = (
    SELECT COALESCE(
      jsonb_object_agg(s->>'type', s->>'value')
        FILTER (WHERE s->>'value' IS NOT NULL AND s->>'value' <> ''),
      '{}'::jsonb
    )
    FROM jsonb_array_elements(selectors) AS s
  ),
  selector_method     = COALESCE(selectors->0->>'type', 'xpath'),
  element_properties  = COALESCE(attributes_snapshot, '{}'::jsonb)
WHERE selectors IS NOT NULL AND selectors <> '[]'::jsonb;

-- Drop old columns
ALTER TABLE test_objects
  DROP COLUMN IF EXISTS selectors,
  DROP COLUMN IF EXISTS attributes_snapshot;
