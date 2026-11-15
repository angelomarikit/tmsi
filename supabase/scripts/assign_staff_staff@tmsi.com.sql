-- TMSI staff access for staff@tmsi.com
--
-- Prerequisite: create the user first in Supabase → Authentication → Users
-- (or have them register), then run this entire script in the SQL Editor.
--
-- Role options: 'super_admin' | 'registrar' | 'content_manager'
-- Default below: registrar (full enrollment + most admin tasks)

do $$
declare
  v_email text := 'staff@tmsi.com';
  v_role_slug text := 'registrar';
  v_user_id uuid;
begin
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(v_email);

  if v_user_id is null then
    raise exception 'No auth user for %. Create the user in Authentication first.', v_email;
  end if;

  insert into public.profiles (id, email, full_name)
  select u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', 'TMSI Staff')
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do update
    set email = excluded.email;

  insert into public.user_roles (user_id, role_id)
  select v_user_id, r.id
  from public.roles r
  where r.slug = v_role_slug::public.app_role
  on conflict (user_id, role_id) do nothing;
end;
$$;

-- Confirm assignment
select p.email, r.slug as role, r.label
from public.user_roles ur
join public.profiles p on p.id = ur.user_id
join public.roles r on r.id = ur.role_id
where lower(p.email) = lower('staff@tmsi.com');