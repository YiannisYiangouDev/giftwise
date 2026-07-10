-- Phase 4: user_settings and push_subscriptions tables

create table if not exists user_settings (
  user_id                    uuid primary key references auth.users(id) on delete cascade,
  email_price_drops          boolean not null default true,
  email_birthday_reminders   boolean not null default true,
  email_weekly_digest        boolean not null default true,
  inapp_price_drops          boolean not null default true,
  inapp_birthday_reminders   boolean not null default true,
  push_enabled               boolean not null default false,
  updated_at                 timestamptz default now()
);

alter table user_settings enable row level security;

create policy "user can read own settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "user can upsert own settings" on user_settings
  for all using (auth.uid() = user_id);

-- Push subscriptions
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  subscription jsonb not null,
  created_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "user can manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- Function to auto-create user_settings row on first sign-up
create or replace function public.handle_new_user_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute procedure public.handle_new_user_settings();
