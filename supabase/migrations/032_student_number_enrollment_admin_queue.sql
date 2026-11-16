-- step 32 — student numbers + staff enrollment queue (names from payload; profile RLS bypass via RPC)

alter table public.profiles
  add column if not exists student_number text;

create unique index if not exists profiles_student_number_key
  on public.profiles (student_number)
  where student_number is not null and length(trim(student_number)) > 0;

create sequence if not exists public.student_number_seq start 1 increment 1;

create or replace function public.assign_student_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_next text;
  v_name text;
begin
  if p_user_id is null then
    return null;
  end if;

  select student_number into v_existing
  from public.profiles
  where id = p_user_id;

  if v_existing is not null and length(trim(v_existing)) > 0 then
    return v_existing;
  end if;

  v_next := 'STU-' || lpad(nextval('public.student_number_seq')::text, 6, '0');

  select nullif(trim(ea.payload->>'fullName'), '')
  into v_name
  from public.enrollment_applications ea
  where ea.applicant_id = p_user_id
  order by ea.submitted_at desc nulls last
  limit 1;

  update public.profiles
  set
    student_number = v_next,
    full_name = coalesce(nullif(trim(full_name), ''), v_name)
  where id = p_user_id;

  return v_next;
end;
$$;

grant execute on function public.assign_student_number(uuid) to authenticated;

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
  perform public.assign_student_number(v_applicant);

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

create or replace function public.admin_list_enrollment_applications()
returns table (
  id uuid,
  applicant_id uuid,
  reference_code text,
  status text,
  course_access_granted boolean,
  submitted_at timestamptz,
  admin_notes text,
  payload jsonb,
  program_id uuid,
  program_title text,
  program_code text,
  program_slug text,
  fee_php numeric,
  email text,
  full_name text,
  student_number text,
  payment_id uuid,
  payment_status text,
  payment_reference text,
  declared_amount numeric,
  payment_date date,
  receipt_path text,
  verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ea.id,
    ea.applicant_id,
    ea.reference_code,
    ea.status::text,
    ea.course_access_granted,
    ea.submitted_at,
    ea.admin_notes,
    ea.payload,
    ea.program_id,
    p.title,
    p.code,
    p.slug,
    p.fee_php,
    coalesce(nullif(trim(pr.email), ''), nullif(trim(ea.payload->>'email'), '')) as email,
    coalesce(nullif(trim(pr.full_name), ''), nullif(trim(ea.payload->>'fullName'), '')) as full_name,
    pr.student_number,
    ps.id,
    ps.status::text,
    ps.reference_number,
    ps.declared_amount,
    ps.payment_date,
    ps.receipt_path,
    ps.verified_at
  from public.enrollment_applications ea
  join public.programs p on p.id = ea.program_id
  left join public.profiles pr on pr.id = ea.applicant_id
  left join lateral (
    select
      ps.id,
      ps.status,
      ps.reference_number,
      ps.declared_amount,
      ps.payment_date,
      ps.receipt_path,
      ps.verified_at
    from public.payment_submissions ps
    where ps.application_id = ea.id
      and ps.application_type = 'leap_enrollment'
    order by ps.created_at desc
    limit 1
  ) ps on true
  where public.is_staff()
  order by ea.submitted_at desc nulls last, ea.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_enrollment_applications() to authenticated;

-- Assign numbers for learners already approved before this migration
do $$
declare
  r record;
begin
  for r in
    select distinct ea.applicant_id
    from public.enrollment_applications ea
    where ea.status = 'approved'
      and ea.applicant_id is not null
  loop
    perform public.assign_student_number(r.applicant_id);
  end loop;
end;
$$;