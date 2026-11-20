-- step 45 — list all learner accounts on Admin → Students; grant student role on sign-up

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_role uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  select r.id into v_student_role from public.roles r where r.slug = 'student';
  if v_student_role is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, v_student_role)
  on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

-- Backfill student role for existing learner profiles (non-staff)
insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
cross join public.roles r
where r.slug = 'student'
  and not exists (
    select 1
    from public.user_roles ur
    join public.roles r2 on r2.id = ur.role_id
    where ur.user_id = p.id
      and r2.slug in ('super_admin', 'registrar', 'content_manager')
  )
  and not exists (
    select 1
    from public.user_roles ur
    join public.roles r2 on r2.id = ur.role_id
    where ur.user_id = p.id
      and r2.slug = 'student'
  )
on conflict (user_id, role_id) do nothing;

drop function if exists public.admin_list_students();

create or replace function public.admin_list_students()
returns table (
  id uuid,
  email text,
  full_name text,
  student_number text,
  created_at timestamptz,
  has_student_role boolean,
  enrollment_count bigint,
  latest_enrollment_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.student_number,
    p.created_at,
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug = 'student'
    ) as has_student_role,
    (
      select count(*)
      from public.enrollment_applications ea
      where ea.applicant_id = p.id
    ) as enrollment_count,
    (
      select ea.status::text
      from public.enrollment_applications ea
      where ea.applicant_id = p.id
      order by ea.submitted_at desc nulls last, ea.created_at desc
      limit 1
    ) as latest_enrollment_status
  from public.profiles p
  where public.is_staff()
    and not exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug in ('super_admin', 'registrar', 'content_manager')
    )
  order by p.created_at desc
  limit 500;
$$;

grant execute on function public.admin_list_students() to authenticated;