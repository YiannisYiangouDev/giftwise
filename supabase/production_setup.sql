-- =============================================
-- GiftWise — Complete Production SQL — DO-block safe version
-- Run at: https://supabase.com/dashboard/project/pnmsysqljdnprcwkerlf/sql/new
-- Run ALL at once — every POLICY uses DO $$ blocks to avoid syntax errors
-- =============================================

-- 1. Create admins table + seed
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "admins_read_own" ON admins FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed admin user (66f6840b-007e-4421-95f6-e372adf48305 = yiannis@yiangouweb.com)
INSERT INTO admins (user_id) VALUES ('66f6840b-007e-4421-95f6-e372adf48305')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_recipients_birthday ON recipients(birthday);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_price_history_item_checked ON price_history(item_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_wishlist_items_price_target ON wishlist_items(target_price, current_best_price) WHERE target_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlists_share_token ON wishlists(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlists_recipient_created ON wishlists(recipient_id, created_at DESC);

-- 3. Data integrity (DO blocks)
DO $$ BEGIN ALTER TABLE wishlist_items ADD CONSTRAINT chk_target_price_positive CHECK (target_price IS NULL OR target_price > 0); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE price_history ADD CONSTRAINT chk_price_positive CHECK (price > 0); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE recipients ADD CONSTRAINT chk_budget_range CHECK (budget_max >= budget_min); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. RLS gaps (DO blocks)
DO $$ BEGIN CREATE POLICY "users_update_own_contributions" ON contributions FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "users_delete_own_contributions" ON contributions FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "creator_update_groups" ON secret_santa_groups FOR UPDATE USING (auth.uid() = creator_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "creator_update_participants" ON secret_santa_participants FOR UPDATE USING (group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE tracked_stores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "authenticated_read_stores" ON tracked_stores FOR SELECT USING (auth.role() = 'authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- 5. updated_at columns + triggers (migration 0007)
-- =============================================
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE secret_santa_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

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
  FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I; CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t, t, t);
  END LOOP;
END $$;

-- =============================================
-- 6. total_contributed trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_total_contributed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wishlist_items SET total_contributed = (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE item_id = NEW.item_id) WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wishlist_items SET total_contributed = (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE item_id = OLD.item_id) WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contributions_total ON contributions;
CREATE TRIGGER trg_contributions_total AFTER INSERT OR DELETE ON contributions FOR EACH ROW EXECUTE FUNCTION update_total_contributed();

-- =============================================
-- 7. pg_cron settings (required by 0003_cron.sql)
-- =============================================
DO $$
BEGIN
  PERFORM set_config('app.supabase_url', 'https://pnmsysqljdnprcwkerlf.supabase.co', false);
  PERFORM set_config('app.service_role_key', current_setting('pgrst.jwt_secret', true), false);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron settings: set via ALTER DATABASE postgres SET app.supabase_url = ...';
END $$;

COMMIT;

-- === VERIFICATION (run separately if desired) ===
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;
-- SELECT * FROM admins;
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
