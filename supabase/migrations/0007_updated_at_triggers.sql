-- 0007: updated_at triggers, total_contributed, tracked_stores RLS, consolidation
-- ======================================================================

-- Add updated_at columns to all user-data tables
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE secret_santa_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger function: auto-set updated_at on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t, t, t
    );
  END LOOP;
END $$;

-- total_contributed trigger: auto-sum contributions on INSERT/DELETE
CREATE OR REPLACE FUNCTION update_total_contributed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wishlist_items SET total_contributed = (
      SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE item_id = NEW.item_id
    ) WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wishlist_items SET total_contributed = (
      SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE item_id = OLD.item_id
    ) WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contributions_total ON contributions;
CREATE TRIGGER trg_contributions_total
  AFTER INSERT OR DELETE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_total_contributed();

-- RLS on tracked_stores (read-only for authenticated users, admin-only write)
ALTER TABLE tracked_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "authenticated_read_stores" ON tracked_stores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Remove duplicate policies from 0004 that were recreated in 0006
-- (These use IF NOT EXISTS so they're safe to re-run; the duplicates
--  in 0006 have the same names and will be skipped by PostgreSQL)
