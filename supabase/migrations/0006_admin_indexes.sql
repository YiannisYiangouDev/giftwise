-- 0006: Admin roles + performance indexes

-- Admins table (replaces email-based ADMIN_EMAILS env var)
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_own" ON admins FOR SELECT USING (auth.uid() = user_id);

-- Insert the bootstrap admin (run manually with your user ID)
-- SELECT user_id FROM admins WHERE user_id = 'your-user-id';
-- INSERT INTO admins (user_id) VALUES ('your-user-id');

-- Performance indexes (see DATABASE_PRODUCTION_REVIEW.md)
CREATE INDEX IF NOT EXISTS idx_recipients_birthday ON recipients(birthday);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_price_history_item_checked ON price_history(item_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_wishlist_items_price_target ON wishlist_items(target_price, current_best_price) WHERE target_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlists_share_token ON wishlists(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlists_recipient_created ON wishlists(recipient_id, created_at DESC);

-- Data integrity constraints
ALTER TABLE wishlist_items ADD CONSTRAINT IF NOT EXISTS chk_target_price_positive CHECK (target_price IS NULL OR target_price > 0);
ALTER TABLE price_history ADD CONSTRAINT IF NOT EXISTS chk_price_positive CHECK (price > 0);
ALTER TABLE recipients ADD CONSTRAINT IF NOT EXISTS chk_budget_range CHECK (budget_max >= budget_min);

-- RLS gaps: contributions update/delete
CREATE POLICY IF NOT EXISTS "users_update_own_contributions" ON contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_delete_own_contributions" ON contributions FOR DELETE USING (auth.uid() = user_id);

-- RLS gaps: secret santa creator update + participant draw
CREATE POLICY IF NOT EXISTS "creator_update_groups" ON secret_santa_groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "creator_update_participants" ON secret_santa_participants FOR UPDATE USING (group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid()));
