-- step 17 — course access flag, staff verify/approve RPCs, notifications, audit

alter table public.enrollment_applications
  add column if not exists course_access_granted boolean not null default false,
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists approved_at timestamptz,
  add column if not exists admin_notes text;

alter table public.payment_submissions
  add column if not exists verified_by uuid references public.profiles (id),
  add column if not exists verified_at timestamptz;

-- One active pipeline per student/course (resubmit after rejected allowed; add enum 'cancelled' in a future migration if needed)
create unique index if not exists enrollment_one_active_per_program
  on public.enrollment_applications (applicant_id, program_id)
  where status in ('submitted', 'under_review', 'correction_requested', 'approved');

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.in_app_notifications enable row level security;

drop policy if exists notifications_own on public.in_app_notifications;
create policy notifications_own
on public.in_app_notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_staff_insert on public.in_app_notifications;
create policy notifications_insert
on public.in_app_notifications for insert
to authenticated
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists notifications_own_update on public.in_app_notifications;
create policy notifications_own_update
on public.in_app_notifications for update
to authenticated
using (user_id = auth.uid());

create or replace function public.user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollment_applications ea
    where ea.applicant_id = p_user_id
      and ea.program_id = p_program_id
      and ea.status = 'approved'
      and ea.course_access_granted = true
      and exists (
        select 1
        from public.payment_submissions ps
        where ps.application_id = ea.id
          and ps.application_type = 'leap_enrollment'
          and ps.status = 'verified'
      )
  );
$$;

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
    ea.course_access_granted,
    ea.submitted_at,
    ea.approved_at
  from public.enrollment_applications ea
  join public.programs p on p.id = ea.program_id
  left join lateral (
    select status
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

create or replace function public.admin_enrollment_approval_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    return null;
  end if;
  return jsonb_build_object(
    'pending_approval',
      (select count(*) from enrollment_applications where status = 'submitted'),
    'pending_payment_verification',
      (select count(*) from payment_submissions ps
       join enrollment_applications ea on ea.id = ps.application_id
       where ps.application_type = 'leap_enrollment'
         and ps.status in ('submitted', 'pending_verification')),
    'approved',
      (select count(*) from enrollment_applications where status = 'approved'),
  'corrections_requested',
      (select count(*) from enrollment_applications where status = 'correction_requested'),
    'rejected',
      (select count(*) from enrollment_applications where status = 'rejected')
  );
end;
$$;

grant execute on function public.admin_enrollment_approval_stats() to authenticated;

create or replace function public.staff_verify_payment(p_application_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay_id uuid;
  v_applicant uuid;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  select applicant_id into v_applicant
  from enrollment_applications where id = p_application_id;
  if v_applicant is null then
    raise exception 'application not found';
  end if;

  update payment_submissions
  set status = 'verified',
      verified_by = auth.uid(),
      verified_at = now()
  where application_id = p_application_id
    and application_type = 'leap_enrollment'
  returning id into v_pay_id;

  if v_pay_id is null then
    raise exception 'no payment submission';
  end if;

  insert into payment_verifications (
    payment_submission_id, verified_by, verified_at, status, reviewer_notes, verified_amount
  )
  select id, auth.uid(), now(), 'verified', p_notes, declared_amount
  from payment_submissions where id = v_pay_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'payment_verified',
    'enrollment_application',
    p_application_id,
    jsonb_build_object('payment_submission_id', v_pay_id, 'notes', p_notes)
  );
end;
$$;

grant execute on function public.staff_verify_payment(uuid, text) to authenticated;

create or replace function public.staff_approve_enrollment(p_application_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
  v_program uuid;
  v_pay_ok boolean;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;

  select ea.applicant_id, ea.program_id,
    exists (
      select 1 from payment_submissions ps
      where ps.application_id = ea.id
        and ps.application_type = 'leap_enrollment'
        and ps.status = 'verified'
    )
  into v_applicant, v_program, v_pay_ok
  from enrollment_applications ea
  where ea.id = p_application_id;

  if v_applicant is null then
    raise exception 'application not found';
  end if;
  if not v_pay_ok then
    raise exception 'payment must be verified before enrollment approval';
  end if;

  update enrollment_applications
  set status = 'approved',
      course_access_granted = true,
      approved_by = auth.uid(),
      approved_at = now(),
      admin_notes = coalesce(p_notes, admin_notes)
  where id = p_application_id;

  perform public.grant_student_role(v_applicant);

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (
    v_applicant,
    'enrollment_approved',
    'Enrollment approved',
    'Your enrollment has been approved. You can now access your course materials.',
    '/dashboard'
  );

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'enrollment_approved',
    'enrollment_application',
    p_application_id,
    jsonb_build_object('program_id', v_program, 'notes', p_notes)
  );
end;
$$;

grant execute on function public.staff_approve_enrollment(uuid, text) to authenticated;

create or replace function public.staff_reject_enrollment(p_application_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select applicant_id into v_applicant from enrollment_applications where id = p_application_id;
  update enrollment_applications
  set status = 'rejected', course_access_granted = false, admin_notes = p_reason
  where id = p_application_id;
  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (v_applicant, 'enrollment_rejected', 'Enrollment not approved', p_reason, '/dashboard/enrollments');
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'enrollment_rejected', 'enrollment_application', p_application_id, jsonb_build_object('reason', p_reason));
end;
$$;

grant execute on function public.staff_reject_enrollment(uuid, text) to authenticated;

create or replace function public.staff_request_enrollment_correction(p_application_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select applicant_id into v_applicant from enrollment_applications where id = p_application_id;
  update enrollment_applications
  set status = 'correction_requested', course_access_granted = false, admin_notes = p_message
  where id = p_application_id;
  update payment_submissions set status = 'pending_verification'
  where application_id = p_application_id and application_type = 'leap_enrollment';
  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (v_applicant, 'correction_requested', 'Correction required', p_message, '/enroll');
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'correction_requested', 'enrollment_application', p_application_id, jsonb_build_object('message', p_message));
end;
$$;

grant execute on function public.staff_request_enrollment_correction(uuid, text) to authenticated;

-- Staff read all enrollments/payments (if not already)
drop policy if exists enrollment_staff_select on public.enrollment_applications;
create policy enrollment_staff_select
on public.enrollment_applications for select
to authenticated
using (public.is_staff() or applicant_id = auth.uid());