-- step 44 — staff remove duplicate / mistaken student login (auth + related rows)

create or replace function public.staff_delete_student_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;

  if exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.slug in ('super_admin', 'registrar', 'content_manager')
  ) then
    raise exception 'Cannot delete staff or registrar accounts';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'Profile not found';
  end if;

  delete from public.payment_submissions ps
  where ps.application_id in (
    select ea.id from public.enrollment_applications ea where ea.applicant_id = p_user_id
  )
     or ps.application_id in (
    select ma.id from public.membership_applications ma where ma.applicant_id = p_user_id
  );

  delete from public.enrollment_applications where applicant_id = p_user_id;
  delete from public.membership_applications where applicant_id = p_user_id;

  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.staff_delete_student_account(uuid) to authenticated;