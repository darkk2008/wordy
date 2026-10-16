-- wwordy cloud sync: run this ONCE in a NEW Supabase project (SQL Editor > New query > paste > Run).
-- Then also run supabase-delete-account.sql.
-- Before using the app: Authentication > Providers > Email > turn OFF "Confirm email".

-- 1) Tables -------------------------------------------------------------------------------------
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by_device text
);

create table if not exists public.user_security (
  user_id uuid primary key references auth.users (id) on delete cascade,
  public_id text not null,
  created_at timestamptz not null default now(),
  constraint public_id_format check (public_id ~ '^[A-Za-z0-9_.-]{3,24}$')
);
-- IDs are unique regardless of upper/lower case
create unique index if not exists user_security_public_id_lower_idx on public.user_security (lower(public_id));

-- 2) Row level security: every signed-in user can only touch their own rows ---------------------
alter table public.user_data enable row level security;
alter table public.user_security enable row level security;

drop policy if exists "own data select" on public.user_data;
drop policy if exists "own data insert" on public.user_data;
drop policy if exists "own data update" on public.user_data;
drop policy if exists "own data delete" on public.user_data;
create policy "own data select" on public.user_data for select to authenticated using (user_id = auth.uid());
create policy "own data insert" on public.user_data for insert to authenticated with check (user_id = auth.uid());
create policy "own data update" on public.user_data for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own data delete" on public.user_data for delete to authenticated using (user_id = auth.uid());

drop policy if exists "own security select" on public.user_security;
drop policy if exists "own security delete" on public.user_security;
create policy "own security select" on public.user_security for select to authenticated using (user_id = auth.uid());
create policy "own security delete" on public.user_security for delete to authenticated using (user_id = auth.uid());
-- (no insert/update policy: IDs are only created through register_security below)

-- 3) Functions used by the app ---------------------------------------------------------------------
-- Is this ID free? (callable before sign-up, so it is open to the anon role)
create or replace function public.id_available(p_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.user_security where lower(public_id) = lower(trim(p_id)));
$$;

-- Turns an ID into the behind-the-scenes sign-in address, only if that ID exists.
create or replace function public.id_to_email(p_id text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select 'wordify+' || lower(trim(p_id)) || '@gmail.com'
  where exists (select 1 from public.user_security where lower(public_id) = lower(trim(p_id)));
$$;

-- Saves the chosen ID for the signed-in user (once).
create or replace function public.register_security(p_public_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_public_id is null or p_public_id !~ '^[A-Za-z0-9_.-]{3,24}$' then
    raise exception 'invalid ID';
  end if;
  insert into public.user_security (user_id, public_id) values (auth.uid(), trim(p_public_id));
exception when unique_violation then
  raise exception 'That ID is already taken.';
end;
$$;

revoke all on function public.id_available(text) from public;
revoke all on function public.id_to_email(text) from public;
revoke all on function public.register_security(text) from public;
grant execute on function public.id_available(text) to anon, authenticated;
grant execute on function public.id_to_email(text) to anon, authenticated;
grant execute on function public.register_security(text) to authenticated;

-- 4) Live updates between devices -----------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.user_data;
exception when duplicate_object then null;
end $$;
