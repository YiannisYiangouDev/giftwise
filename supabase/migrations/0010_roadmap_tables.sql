-- 0010: Database schema changes for premium features and luxury UI roadmap
-- =========================================================================

-- 1. Add shipping address field to recipients
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 2. Secret Santa Group draw exclusions
CREATE TABLE IF NOT EXISTS santa_draw_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_santa_groups(id) ON DELETE CASCADE NOT NULL,
  user_id_a UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id_b UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id_a, user_id_b)
);

-- 3. Anonymous Secret Santa Q&A
CREATE TABLE IF NOT EXISTS santa_qa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_santa_groups(id) ON DELETE CASCADE NOT NULL,
  giver_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- 4. Secret Santa Group Chat Messages
CREATE TABLE IF NOT EXISTS santa_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_santa_groups(id) ON DELETE CASCADE NOT NULL,
  sender_alias TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE santa_draw_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE santa_qa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE santa_chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable Realtime Broadcast for QA and Chat
ALTER PUBLICATION supabase_realtime ADD TABLE santa_qa_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE santa_chat_messages;

-- RLS Policies for Exclusions
CREATE POLICY "participants_see_exclusions" ON santa_draw_exclusions
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM secret_santa_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "creator_manage_exclusions" ON santa_draw_exclusions
  FOR ALL USING (
    group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid())
  );

-- RLS Policies for QA Messages
CREATE POLICY "givers_and_receivers_see_qa" ON santa_qa_messages
  FOR SELECT USING (auth.uid() = giver_user_id OR auth.uid() = receiver_user_id);
CREATE POLICY "givers_insert_qa" ON santa_qa_messages
  FOR INSERT WITH CHECK (auth.uid() = giver_user_id);
CREATE POLICY "receivers_answer_qa" ON santa_qa_messages
  FOR UPDATE USING (auth.uid() = receiver_user_id) WITH CHECK (auth.uid() = receiver_user_id);

-- RLS Policies for Group Chat Messages
CREATE POLICY "members_see_chat" ON santa_chat_messages
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM secret_santa_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "members_send_chat" ON santa_chat_messages
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM secret_santa_participants WHERE user_id = auth.uid())
  );

-- RLS Update Policies for Secret Santa Participant Table (Allows draw matches and editing wishlist URLs)
DROP POLICY IF EXISTS "participants_update_own" ON secret_santa_participants;
CREATE POLICY "participants_update_own" ON secret_santa_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_update_assignments" ON secret_santa_participants;
CREATE POLICY "creator_update_assignments" ON secret_santa_participants
  FOR UPDATE USING (
    group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid())
  );
