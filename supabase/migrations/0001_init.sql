-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Recipients (people you buy gifts for)
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  birthday DATE,
  photo_url TEXT,
  notes TEXT,
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  occasion TEXT,
  event_date DATE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wishlist items (tracked products)
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  target_price DECIMAL(10,2),
  current_best_price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'wanted' CHECK (status IN ('wanted','claimed','purchased','received')),
  claimed_by UUID REFERENCES auth.users,
  claimed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Price history snapshots
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  store_url TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  in_stock BOOLEAN DEFAULT true,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- Tracked stores configuration
CREATE TABLE IF NOT EXISTS tracked_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'CY',
  scraper_type TEXT NOT NULL,
  scraper_config JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  item_id UUID REFERENCES wishlist_items(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own_recipients" ON recipients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_wishlists" ON wishlists
  FOR ALL USING (
    recipient_id IN (SELECT id FROM recipients WHERE user_id = auth.uid())
  );

CREATE POLICY "public_shared_wishlists" ON wishlists
  FOR SELECT USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "users_own_items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (
      SELECT w.id FROM wishlists w
      JOIN recipients r ON w.recipient_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "public_shared_items" ON wishlist_items
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE is_public = true)
  );

CREATE POLICY "users_own_price_history" ON price_history
  FOR ALL USING (
    item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      JOIN recipients r ON w.recipient_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_recipient_id ON wishlists(recipient_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_checked_at ON price_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
