-- 0008: Add claimed_by_name column and claim RLS/Triggers
-- =======================================================

-- 1. Add claimed_by_name column to wishlist_items
ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS claimed_by_name TEXT;

-- 2. Create trigger function to ensure non-owners cannot update other fields
CREATE OR REPLACE FUNCTION protect_wishlist_items_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if updater is the owner of the wishlist's recipient.
  -- We identify the owner by checking if auth.uid() matches recipients.user_id.
  IF NOT EXISTS (
    SELECT 1 FROM wishlists w
    JOIN recipients r ON w.recipient_id = r.id
    WHERE w.id = OLD.wishlist_id AND r.user_id = auth.uid()
  ) THEN
    -- If not the owner, prevent changing core product fields.
    IF NEW.wishlist_id <> OLD.wishlist_id OR
       NEW.product_name <> OLD.product_name OR
       (NEW.product_url IS DISTINCT FROM OLD.product_url) OR
       (NEW.image_url IS DISTINCT FROM OLD.image_url) OR
       (NEW.target_price IS DISTINCT FROM OLD.target_price) THEN
      RAISE EXCEPTION 'You are not authorized to modify these product fields.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger (if it doesn't already exist)
DROP TRIGGER IF EXISTS trigger_protect_wishlist_items ON wishlist_items;
CREATE TRIGGER trigger_protect_wishlist_items
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION protect_wishlist_items_fields();

-- 4. Enable RLS Update policy for public wishlist items
DROP POLICY IF EXISTS "allow_public_update_items" ON wishlist_items;
CREATE POLICY "allow_public_update_items" ON wishlist_items
  FOR UPDATE
  USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE is_public = true)
  )
  WITH CHECK (
    wishlist_id IN (SELECT id FROM wishlists WHERE is_public = true)
  );
