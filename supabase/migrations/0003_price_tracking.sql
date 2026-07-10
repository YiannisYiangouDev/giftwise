-- Phase 3: price_history and price_alerts tables

create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references wishlist_items(id) on delete cascade,
  price       numeric(10,2) not null,
  store_name  text,
  store_url   text,
  in_stock    boolean default true,
  scraped_at  timestamptz not null default now()
);

create index if not exists price_history_item_id_scraped_at
  on price_history(item_id, scraped_at desc);

create table if not exists price_alerts (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references wishlist_items(id) on delete cascade,
  old_price    numeric(10,2),
  new_price    numeric(10,2) not null,
  triggered_at timestamptz not null default now(),
  seen_at      timestamptz
);

create index if not exists price_alerts_item_id
  on price_alerts(item_id);

-- Add scraper_type column to wishlist_items so scraper knows which strategy to use
alter table wishlist_items
  add column if not exists scraper_type text check (scraper_type in ('skroutz', 'woocommerce', 'shopify', 'firecrawl'));

-- RLS
alter table price_history enable row level security;
alter table price_alerts enable row level security;

-- price_history: readable by item owner
create policy "owner can read price history" on price_history
  for select using (
    exists (
      select 1 from wishlist_items wi
      join wishlists wl on wl.id = wi.wishlist_id
      where wi.id = price_history.item_id
        and wl.user_id = auth.uid()
    )
  );

-- price_alerts: readable by item owner
create policy "owner can read price alerts" on price_alerts
  for select using (
    exists (
      select 1 from wishlist_items wi
      join wishlists wl on wl.id = wi.wishlist_id
      where wi.id = price_alerts.item_id
        and wl.user_id = auth.uid()
    )
  );

-- price_alerts: owner can mark as seen
create policy "owner can update seen_at" on price_alerts
  for update using (
    exists (
      select 1 from wishlist_items wi
      join wishlists wl on wl.id = wi.wishlist_id
      where wi.id = price_alerts.item_id
        and wl.user_id = auth.uid()
    )
  );

-- service role can insert (used by scraper)
create policy "service role insert price_history" on price_history
  for insert with check (true);

create policy "service role insert price_alerts" on price_alerts
  for insert with check (true);
