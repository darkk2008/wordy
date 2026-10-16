-- Run once in the Supabase SQL editor to let users delete their own account from the app.
-- (Account screen -> "Delete account"). Without it the app can only remove the cloud backup rows.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from public.user_data where user_id = auth.uid();
  delete from public.user_security where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
