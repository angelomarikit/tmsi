-- EXAMPLE — grant super_admin for course PDF upload (run once in SQL Editor)
-- 1) Change the email to YOUR login email (same as Admin sign-in)
-- 2) Do not paste placeholder text like YOUR-USER-UUID-HERE

insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
where lower(u.email) = lower('admin@tmsi.com')
on conflict (id) do update set email = excluded.email;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
join public.roles r on r.slug = 'super_admin'
where lower(u.email) = lower('admin@tmsi.com')
on conflict (user_id, role_id) do nothing;