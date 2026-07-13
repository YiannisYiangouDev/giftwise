-- Add RLS policies for wishlist_items, price_history, notifications
CREATE POLICY "users_own_wishlist_items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (
      SELECT w.id FROM wishlists w
      JOIN recipients r ON r.id = w.recipient_id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_price_history" ON price_history
  FOR ALL USING (
    item_id IN (
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      JOIN recipients r ON r.id = w.recipient_id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Allow items without a URL (manual entry from search)
ALTER TABLE wishlist_items ALTER COLUMN product_url DROP NOT NULL;
