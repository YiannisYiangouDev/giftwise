-- 0005: Group Gifts, Secret Santa & Admin
-- ===========================================

-- Group gift contributions (multiple people chip in for one item)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wishlist_items
  ADD COLUMN IF NOT EXISTS is_group_gift BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_contributed DECIMAL(10,2) DEFAULT 0;

-- Secret Santa groups
CREATE TABLE IF NOT EXISTS secret_santa_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  budget DECIMAL(10,2),
  event_date DATE,
  is_drawn BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Secret Santa participants
CREATE TABLE IF NOT EXISTS secret_santa_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_santa_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  assigned_to_user_id UUID REFERENCES auth.users,
  wishlist_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- RLS for new tables
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can see contributions for items they can access
CREATE POLICY "users_see_contributions" ON contributions
  FOR SELECT USING (
    item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      JOIN recipients r ON r.id = w.recipient_id
      WHERE r.user_id = auth.uid()
    )
  );

-- Anyone can contribute to group gift items
CREATE POLICY "users_insert_contributions" ON contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Secret Santa: participants see their groups
CREATE POLICY "participants_see_groups" ON secret_santa_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM secret_santa_participants WHERE user_id = auth.uid())
    OR creator_id = auth.uid()
  );

CREATE POLICY "creator_insert_groups" ON secret_santa_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Participants see members of their groups
CREATE POLICY "participants_see_members" ON secret_santa_participants
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM secret_santa_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "participants_insert" ON secret_santa_participants
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid())
  );

-- Admin: allow viewing assigned person (only after draw)
CREATE POLICY "view_assignment" ON secret_santa_participants
  FOR SELECT USING (user_id = auth.uid());
