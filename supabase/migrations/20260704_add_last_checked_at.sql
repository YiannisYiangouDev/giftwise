-- Add last_checked_at to wishlist_items if it doesn't exist
alter table public.wishlist_items
  add column if not exists last_checked_at timestamptz;

-- Add read column to notifications if it doesn't exist  
alter table public.notifications
  add column if not exists read boolean not null default false;

-- Index to quickly fetch unread notifications per user
create index if not exists notifications_user_unread
  on public.notifications (user_id, read)
  where read = false;
