-- Seed tracked stores for Cyprus and Greece
INSERT INTO tracked_stores (name, base_url, country, scraper_type, scraper_config) VALUES
  ('Skroutz.cy', 'https://www.skroutz.cy', 'CY', 'apify', '{"actor_id": "studio-amba/skroutz-scraper"}'::jsonb),
  ('Skroutz.gr', 'https://www.skroutz.gr', 'GR', 'apify', '{"actor_id": "studio-amba/skroutz-scraper"}'::jsonb),
  ('Electroline', 'https://www.electroline.com.cy', 'CY', 'woocommerce', '{"api_path": "/wp-json/wc/v3/products"}'::jsonb),
  ('Cablenet', 'https://shop.cablenet.com.cy', 'CY', 'woocommerce', '{"api_path": "/wp-json/wc/v3/products"}'::jsonb),
  ('Beauty Bar', 'https://www.beautybar.com.cy', 'CY', 'shopify', '{"products_path": "/products.json"}'::jsonb),
  ('Stephanis', 'https://www.stephanis.com.cy', 'CY', 'custom', '{"selectors": {"price": ".price", "name": "h1", "image": ".product-image img"}}'::jsonb),
  ('Superhome Center', 'https://www.superhomecenter.com.cy', 'CY', 'playwright', '{"js_render": true}'::jsonb),
  ('Bionic', 'https://www.bionic.com.cy', 'CY', 'custom', '{"selectors": {"price": ".product-price", "name": ".product-title"}}'::jsonb)
ON CONFLICT DO NOTHING;
