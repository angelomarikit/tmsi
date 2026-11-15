-- step 27 — notify staff when a TMVS membership application is submitted

create or replace function public.notify_staff_on_membership_submit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'submitted' and new.status is distinct from 'under_review' then
    return new;
  end if;

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  select distinct ur.user_id,
    'membership_pending',
    'New TMVS application to review',
    coalesce(
      'Application ' || coalesce(new.reference_code, left(new.id::text, 8)) || ' — TMVS membership',
      'New TMVS membership application'
    ),
    '/admin/membership-approvals'
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.slug in ('super_admin', 'registrar', 'content_manager');

  return new;
end;
$$;

drop trigger if exists membership_notify_staff on public.membership_applications;
create trigger membership_notify_staff
  after insert on public.membership_applications
  for each row
  execute function public.notify_staff_on_membership_submit();