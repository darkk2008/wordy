-- Server-owned Pro status. Run once in the Supabase SQL editor (after supabase-setup.sql).
-- Users can READ their own row. Nobody but the server (service-role key) can write it.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premium_type text check (premium_type in ('monthly', 'yearly', 'permanent')),
  premium_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "own entitlement select" on public.entitlements;
create policy "own entitlement select" on public.entitlements
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies, and no grants: the service role bypasses RLS, users cannot write.
revoke insert, update, delete on public.entitlements from anon, authenticated;
