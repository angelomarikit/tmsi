-- step 24 — TMVS membership payment proof (receipt upload + admin queue)

-- Applicant can read own membership payments
drop policy if exists payment_select_own_via_enrollment on public.payment_submissions;
create policy payment_select_own_applications
on public.payment_submissions for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.enrollment_applications ea
    where ea.id = payment_submissions.application_id
      and ea.applicant_id = auth.uid()
  )
  or exists (
    select 1
    from public.membership_applications ma
    where ma.id = payment_submissions.application_id
      and ma.applicant_id = auth.uid()
  )
);

drop policy if exists payment_insert_own on public.payment_submissions;
create policy payment_insert_own
on public.payment_submissions for insert
to authenticated
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

-- Receipt storage: enrollment-receipts + membership-receipts
drop policy if exists private_docs_receipt_insert on storage.objects;
create policy private_docs_receipt_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[1] in ('enrollment-receipts', 'membership-receipts')
);

drop policy if exists private_docs_receipt_read on storage.objects;
create policy private_docs_receipt_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] in ('enrollment-receipts', 'membership-receipts')
  and (
    public.is_staff()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);

drop function if exists public.admin_list_membership_applications();

create or replace function public.admin_list_membership_applications()
returns table (
  id uuid,
  applicant_id uuid,
  reference_code text,
  status text,
  membership_access_granted boolean,
  package_code text,
  submitted_at timestamptz,
  approved_at timestamptz,
  admin_notes text,
  payload jsonb,
  email text,
  full_name text,
  username text,
  payment_reference_number text,
  payment_status text,
  payment_date date,
  payment_declared_amount numeric,
  payment_receipt_path text,
  payment_verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ma.id,
    ma.applicant_id,
    ma.reference_code,
    ma.status::text,
    ma.membership_access_granted,
    ma.package_code,
    ma.submitted_at,
    ma.approved_at,
    ma.admin_notes,
    ma.payload,
    coalesce(nullif(trim(p.email), ''), nullif(trim(ma.payload->>'email'), '')) as email,
    coalesce(nullif(trim(p.full_name), ''), nullif(trim(ma.payload->>'fullName'), '')) as full_name,
    coalesce(nullif(trim(p.username), ''), nullif(trim(ma.payload->>'username'), '')) as username,
    ps.reference_number as payment_reference_number,
    ps.status::text as payment_status,
    ps.payment_date,
    ps.declared_amount as payment_declared_amount,
    ps.receipt_path as payment_receipt_path,
    ps.verified_at as payment_verified_at
  from public.membership_applications ma
  left join public.profiles p on p.id = ma.applicant_id
  left join lateral (
    select
      reference_number,
      status,
      payment_date,
      declared_amount,
      receipt_path,
      verified_at
    from public.payment_submissions pay
    where pay.application_id = ma.id
      and pay.application_type = 'tmvs_membership'
    order by pay.created_at desc
    limit 1
  ) ps on true
  where public.is_staff()
  order by ma.submitted_at desc nulls last, ma.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_membership_applications() to authenticated;

create or replace function public.staff_approve_membership(p_application_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
  v_pay_id uuid;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;

  select applicant_id into v_applicant
  from membership_applications where id = p_application_id;
  if v_applicant is null then
    raise exception 'application not found';
  end if;

  select pay.id into v_pay_id
  from payment_submissions pay
  where pay.application_id = p_application_id
    and pay.application_type = 'tmvs_membership'
  order by pay.created_at desc
  limit 1;

  if v_pay_id is null then
    raise exception 'payment proof required before approval';
  end if;

  update payment_submissions
  set status = 'verified',
      verified_by = auth.uid(),
      verified_at = now()
  where id = v_pay_id;

  update membership_applications
  set status = 'approved',
      membership_access_granted = true,
      approved_by = auth.uid(),
      approved_at = now(),
      admin_notes = coalesce(p_notes, admin_notes)
  where id = p_application_id;

  perform public.grant_tmvs_member_role(v_applicant);

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (
    v_applicant,
    'membership_approved',
    'TMVS membership approved',
    'Your membership has been approved. Sign in and open Downloads for member materials.',
    '/dashboard/downloads'
  );

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'membership_approved',
    'membership_application',
    p_application_id,
    jsonb_build_object('notes', p_notes, 'payment_submission_id', v_pay_id)
  );
end;
$$;

grant execute on function public.staff_approve_membership(uuid, text) to authenticated;