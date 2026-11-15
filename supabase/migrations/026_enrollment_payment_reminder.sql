-- step 26 — enrollment payment receipt flag + student reminder

drop function if exists public.list_student_dashboard_enrollments();

create or replace function public.list_student_dashboard_enrollments()
returns table (
  application_id uuid,
  program_id uuid,
  slug text,
  code text,
  title text,
  subtitle text,
  cover_asset_key text,
  reference_code text,
  enrollment_status text,
  payment_status text,
  has_payment_receipt boolean,
  course_access_granted boolean,
  submitted_at timestamptz,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ea.id,
    p.id,
    p.slug,
    p.code,
    p.title,
    p.subtitle,
    p.cover_asset_key,
    ea.reference_code,
    ea.status::text,
    coalesce(ps.status::text, 'none'),
    coalesce(ps.has_receipt, false),
    ea.course_access_granted,
    ea.submitted_at,
    ea.approved_at
  from public.enrollment_applications ea
  join public.programs p on p.id = ea.program_id
  left join lateral (
    select
      ps.status,
      (ps.receipt_path is not null and length(trim(ps.receipt_path)) > 0) as has_receipt
    from public.payment_submissions ps
    where ps.application_id = ea.id
      and ps.application_type = 'leap_enrollment'
    order by ps.created_at desc
    limit 1
  ) ps on true
  where ea.applicant_id = auth.uid()
    and ea.status <> 'draft'::public.application_status
  order by ea.submitted_at desc nulls last;
$$;

grant execute on function public.list_student_dashboard_enrollments() to authenticated;

create or replace function public.ensure_enrollment_payment_reminder()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missing int;
begin
  select count(*)::int into v_missing
  from public.enrollment_applications ea
  where ea.applicant_id = auth.uid()
    and ea.status in ('submitted', 'under_review', 'correction_requested')
    and not exists (
      select 1
      from public.payment_submissions ps
      where ps.application_id = ea.id
        and ps.application_type = 'leap_enrollment'
        and ps.receipt_path is not null
        and length(trim(ps.receipt_path)) > 0
    );

  if v_missing = 0 then
    return;
  end if;

  if exists (
    select 1
    from public.in_app_notifications n
    where n.user_id = auth.uid()
      and n.kind = 'enrollment_payment_missing'
      and n.created_at > now() - interval '7 days'
  ) then
    return;
  end if;

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (
    auth.uid(),
    'enrollment_payment_missing',
    'Upload your payment receipt',
    'One or more LEAP enrollments are missing payment proof. Open My Courses and upload your InstaPay reference, date, and receipt.',
    '/dashboard'
  );
end;
$$;

grant execute on function public.ensure_enrollment_payment_reminder() to authenticated;

drop policy if exists payment_update_own_enrollment on public.payment_submissions;
create policy payment_update_own_enrollment
on public.payment_submissions for update
to authenticated
using (
  (
    application_type = 'leap_enrollment'
    and exists (
      select 1
      from public.enrollment_applications ea
      where ea.id = payment_submissions.application_id
        and ea.applicant_id = auth.uid()
    )
  )
  or (
    application_type = 'tmvs_membership'
    and exists (
      select 1
      from public.membership_applications ma
      where ma.id = payment_submissions.application_id
        and ma.applicant_id = auth.uid()
    )
  )
)
with check (
  (
    application_type = 'leap_enrollment'
    and exists (
      select 1
      from public.enrollment_applications ea
      where ea.id = payment_submissions.application_id
        and ea.applicant_id = auth.uid()
    )
  )
  or (
    application_type = 'tmvs_membership'
    and exists (
      select 1
      from public.membership_applications ma
      where ma.id = payment_submissions.application_id
        and ma.applicant_id = auth.uid()
    )
  )
);