-- step 43 — student LEAP enroll / withdraw / payment attach (fixes RLS on re-enroll)

create or replace function public.student_withdraw_enrollment(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  delete from public.payment_submissions ps
  where ps.application_id = p_application_id
    and ps.application_type = 'leap_enrollment';

  update public.enrollment_applications ea
  set
    status = 'rejected',
    admin_notes = trim(both from coalesce(ea.admin_notes, '') || ' Withdrawn by student (wrong course or re-enroll).')
  where ea.id = p_application_id
    and ea.applicant_id = auth.uid()
    and ea.status in ('draft', 'submitted', 'under_review', 'correction_requested');

  if not found then
    raise exception 'This enrollment cannot be withdrawn (not found or already decided).';
  end if;
end;
$$;

create or replace function public.student_create_enrollment_application(
  p_program_id uuid,
  p_payload jsonb,
  p_reference_code text
)
returns table (application_id uuid, reference_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_ref text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.programs p where p.id = p_program_id and p.active and p.publication_status = 'published') then
    raise exception 'This course is not open for enrollment';
  end if;

  if exists (
    select 1
    from public.enrollment_applications ea
    where ea.applicant_id = auth.uid()
      and ea.program_id = p_program_id
      and ea.status in ('submitted', 'under_review', 'correction_requested', 'approved')
  ) then
    raise exception 'You already have an active application for this course';
  end if;

  v_ref := coalesce(nullif(trim(p_reference_code), ''), 'LEAP-' || upper(substring(gen_random_uuid()::text from 1 for 8)));

  insert into public.enrollment_applications (
    applicant_id,
    program_id,
    status,
    reference_code,
    payload,
    submitted_at
  )
  values (
    auth.uid(),
    p_program_id,
    'submitted',
    v_ref,
    coalesce(p_payload, '{}'::jsonb),
    now()
  )
  returning id, enrollment_applications.reference_code into v_id, v_ref;

  application_id := v_id;
  reference_code := v_ref;
  return next;
end;
$$;

create or replace function public.student_attach_enrollment_payment(
  p_application_id uuid,
  p_reference_number text,
  p_receipt_path text,
  p_payment_date date,
  p_declared_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay_id uuid;
  v_ref text := trim(p_reference_number);
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if v_ref = '' then
    raise exception 'Payment reference is required';
  end if;

  if not exists (
    select 1
    from public.enrollment_applications ea
    where ea.id = p_application_id
      and ea.applicant_id = auth.uid()
      and ea.status in ('draft', 'submitted', 'under_review', 'correction_requested')
  ) then
    raise exception 'Enrollment not found or cannot accept payment';
  end if;

  if exists (
    select 1
    from public.payment_submissions ps
    where lower(ps.reference_number) = lower(v_ref)
      and ps.application_id <> p_application_id
  ) then
    raise exception 'This payment reference was already used on another application. Use a new reference or contact the registrar.';
  end if;

  select ps.id
  into v_pay_id
  from public.payment_submissions ps
  where ps.application_id = p_application_id
    and ps.application_type = 'leap_enrollment'
  order by ps.created_at desc
  limit 1;

  if v_pay_id is not null then
    update public.payment_submissions
    set
      reference_number = v_ref,
      receipt_path = p_receipt_path,
      payment_date = p_payment_date,
      declared_amount = p_declared_amount,
      status = 'submitted'
    where id = v_pay_id;
    return v_pay_id;
  end if;

  insert into public.payment_submissions (
    application_type,
    application_id,
    declared_amount,
    reference_number,
    receipt_path,
    payment_date,
    status
  )
  values (
    'leap_enrollment',
    p_application_id,
    p_declared_amount,
    v_ref,
    p_receipt_path,
    p_payment_date,
    'submitted'
  )
  returning id into v_pay_id;

  return v_pay_id;
end;
$$;

create or replace function public.student_find_open_enrollment(p_program_id uuid)
returns table (application_id uuid, reference_code text, has_payment boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    ea.id,
    ea.reference_code,
    exists (
      select 1
      from public.payment_submissions ps
      where ps.application_id = ea.id
        and ps.application_type = 'leap_enrollment'
        and coalesce(ps.receipt_path, '') <> ''
    ) as has_payment
  from public.enrollment_applications ea
  where ea.applicant_id = auth.uid()
    and ea.program_id = p_program_id
    and ea.status in ('draft', 'submitted', 'under_review', 'correction_requested')
  order by ea.created_at desc
  limit 1;
$$;

grant execute on function public.student_withdraw_enrollment(uuid) to authenticated;
grant execute on function public.student_create_enrollment_application(uuid, jsonb, text) to authenticated;
grant execute on function public.student_attach_enrollment_payment(uuid, text, text, date, numeric) to authenticated;
create or replace function public.student_refresh_open_enrollment(
  p_application_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  update public.enrollment_applications ea
  set
    payload = coalesce(p_payload, '{}'::jsonb),
    submitted_at = now(),
    status = 'submitted'
  where ea.id = p_application_id
    and ea.applicant_id = auth.uid()
    and ea.status in ('draft', 'submitted', 'under_review', 'correction_requested');

  if not found then
    raise exception 'Enrollment not found or cannot be updated';
  end if;
end;
$$;

-- Clears other pending LEAP applications so a student can switch courses after a mistake.
create or replace function public.student_withdraw_other_pending_enrollments(p_program_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r record;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  for r in
    select ea.id
    from public.enrollment_applications ea
    where ea.applicant_id = auth.uid()
      and ea.program_id <> p_program_id
      and ea.status in ('draft', 'submitted', 'under_review', 'correction_requested')
  loop
    perform public.student_withdraw_enrollment(r.id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.student_find_open_enrollment(uuid) to authenticated;
grant execute on function public.student_refresh_open_enrollment(uuid, jsonb) to authenticated;
grant execute on function public.student_withdraw_other_pending_enrollments(uuid) to authenticated;