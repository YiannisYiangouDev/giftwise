-- Add alert columns to wishlist_items
ALTER TABLE wishlist_items
  ADD COLUMN IF NOT EXISTS alert_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_sent    boolean NOT NULL DEFAULT false;

-- price_history table (create if missing)
CREATE TABLE IF NOT EXISTS price_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  price       numeric(10,2) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_history_item_id_idx ON price_history(item_id);
CREATE INDEX IF NOT EXISTS price_history_recorded_at_idx ON price_history(recorded_at DESC);

-- RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read_price_history" ON price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wishlist_items wi
      JOIN wishlists w ON w.id = wi.wishlist_id
      WHERE wi.id = price_history.item_id
        AND w.user_id = auth.uid()
    )
  );

-- Re-arm alert_sent whenever current_best_price changes
CREATE OR REPLACE FUNCTION reset_alert_on_price_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_best_price IS DISTINCT FROM OLD.current_best_price THEN
    NEW.alert_sent := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_alert ON wishlist_items;
CREATE TRIGGER trg_reset_alert
BEFORE UPDATE ON wishlist_items
FOR EACH ROW EXECUTE FUNCTION reset_alert_on_price_change();

-- pg_cron job: fire every 6 hours
-- Run this manually once after enabling pg_cron extension:
-- SELECT cron.schedule(
--   'price-drop-alerts',
--   '0 */6 * * *',
--   $$
--     SELECT net.http_post(
--       url        := current_setting('app.edge_fn_base') || '/price-drop-email',
--       headers    := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
--       body       := '{}'::jsonb
--     )
--   $$
-- );
