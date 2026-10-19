-- supabase-entitlements.sql
-- Server-owned Pro status. Users can READ their own row but can never write it.
-- Only the server (service_role key, used by your Netlify promo/payment functions) writes here.
-- Then set  serverEntitlements: true  in window.DM_CONFIG (boot/config.js).

create table if not exists public.entitlements (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  premium_type       text check (premium_type in ('monthly','yearly','permanent')),
  premium_expires_at timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select to authenticated using (auth.uid() = user_id);

-- No insert/update/delete policies on purpose: with RLS on, that means clients cannot write.
revoke insert, update, delete on public.entitlements from anon, authenticated;
