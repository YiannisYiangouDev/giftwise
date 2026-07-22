-- 0011: Fix infinite recursion in secret_santa_participants SELECT policy
-- =======================================================================

-- 1. Drop the recursive SELECT policy on secret_santa_participants
DROP POLICY IF EXISTS "participants_see_members" ON secret_santa_participants;

-- 2. Create a SECURITY DEFINER helper function to bypass RLS checks for group membership queries
CREATE OR REPLACE FUNCTION check_is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM secret_santa_participants
    WHERE group_id = group_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Re-create the SELECT policy using the security helper function to prevent infinite recursion loops
CREATE POLICY "participants_see_members" ON secret_santa_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR check_is_group_member(group_id, auth.uid())
  );
