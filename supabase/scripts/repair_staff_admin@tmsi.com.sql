-- Repair staff role for admin@tmsi.com (run in SQL Editor)
-- Fixes: profile id ≠ auth id, wrong user_id on user_roles, missing role row

do $$
declare
  v_email text := 'admin@tmsi.com';
  v_auth uuid;
begin
  select id into v_auth from auth.users where lower(email) = lower(v_email);
  if v_auth is null then
    raise exception 'No auth user for %. Create/sign in once in the app first.', v_email;
  end if;

  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', 'TMSI Admin')
  from auth.users u
  where u.id = v_auth
  on conflict (id) do update
    set email = excluded.email;

  -- Remove role rows tied to wrong profile ids for this email
  delete from public.user_roles ur
  using public.profiles p
  where ur.user_id = p.id
    and lower(p.email) = lower(v_email)
    and ur.user_id <> v_auth;

  insert into public.user_roles (user_id, role_id)
  select v_auth, r.id
  from public.roles r
  where r.slug = 'super_admin'
  on conflict (user_id, role_id) do nothing;
end;
$$;

select
  u.id as auth_user_id,
  p.id as profile_id,
  p.id = u.id as ids_match,
  r.slug as staff_role
from auth.users u
left join public.profiles p on p.id = u.id
left join public.user_roles ur on ur.user_id = u.id
left join public.roles r on r.id = ur.role_id
where lower(u.email) = lower('admin@tmsi.com');