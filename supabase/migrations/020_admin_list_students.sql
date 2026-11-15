-- step 20 — Students admin list: learner role only (exclude staff accounts)

create or replace function public.admin_list_students()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.email, p.full_name, p.created_at
  from public.profiles p
  where public.is_staff()
    and exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug = 'student'
    )
    and not exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug in ('super_admin', 'registrar', 'content_manager')
    )
  order by p.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_students() to authenticated;