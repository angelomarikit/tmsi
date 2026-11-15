-- step 18 — notify staff when a LEAP enrollment is submitted (security definer bypasses RLS)

create or replace function public.notify_staff_on_enrollment_submit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_title text;
begin
  if new.status is distinct from 'submitted' and new.status is distinct from 'under_review' then
    return new;
  end if;

  select title into v_program_title from programs where id = new.program_id;

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  select distinct ur.user_id,
    'enrollment_pending',
    'New enrollment to review',
    coalesce(
      'Application ' || coalesce(new.reference_code, left(new.id::text, 8)) || ' — ' || coalesce(v_program_title, 'LEAP course'),
      'New LEAP enrollment application'
    ),
    '/admin/enrollment-approvals'
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.slug in ('super_admin', 'registrar', 'content_manager');

  return new;
end;
$$;

drop trigger if exists enrollment_notify_staff on public.enrollment_applications;
create trigger enrollment_notify_staff
  after insert on public.enrollment_applications
  for each row
  execute function public.notify_staff_on_enrollment_submit();