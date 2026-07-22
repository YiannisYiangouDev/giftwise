-- 0012: Add DELETE RLS policy for Secret Santa groups creator
-- ==========================================================

CREATE POLICY "creator_delete_groups" ON secret_santa_groups
  FOR DELETE USING (auth.uid() = creator_id);
