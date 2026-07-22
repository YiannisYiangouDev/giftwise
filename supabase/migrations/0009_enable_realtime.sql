-- 0009: Enable Supabase Realtime for wishlist_items and contributions
-- ==================================================================

-- Add tables to the supabase_realtime publication to enable broadcast
alter publication supabase_realtime add table wishlist_items;
alter publication supabase_realtime add table contributions;
