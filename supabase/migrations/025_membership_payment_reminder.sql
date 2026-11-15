-- step 25 — flag missing TMVS payment receipt + remind applicant

create or replace function public.my_membership_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'application_id', ma.id,
        'reference_code', ma.reference_code,
        'status', ma.status::text,
        'membership_access_granted', ma.membership_access_granted,
        'submitted_at', ma.submitted_at,
        'approved_at', ma.approved_at,
        'has_payment_receipt', exists (
          select 1
          from public.payment_submissions ps
          where ps.application_id = ma.id
            and ps.application_type = 'tmvs_membership'
            and ps.receipt_path is not null
            and length(trim(ps.receipt_path)) > 0
        )
      )
      from public.membership_applications ma
      where ma.applicant_id = auth.uid()
      order by ma.submitted_at desc nulls last, ma.created_at desc
      limit 1
    ),
    'null'::jsonb
  );
$$;

grant execute on function public.my_membership_status() to authenticated;

create or replace function public.ensure_membership_payment_reminder()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app_id uuid;
  v_status text;
  v_has_receipt boolean;
begin
  select
    ma.id,
    ma.status::text,
    exists (
      select 1 from public.payment_submissions ps
      where ps.application_id = ma.id
        and ps.application_type = 'tmvs_membership'
        and ps.receipt_path is not null
        and length(trim(ps.receipt_path)) > 0
    )
  into v_app_id, v_status, v_has_receipt
  from public.membership_applications ma
  where ma.applicant_id = auth.uid()
  order by ma.submitted_at desc nulls last, ma.created_at desc
  limit 1;

  if v_app_id is null or v_has_receipt then
    return;
  end if;

  if v_status not in ('submitted', 'under_review', 'correction_requested', 'draft') then
    return;
  end if;

  if exists (
    select 1
    from public.in_app_notifications n
    where n.user_id = auth.uid()
      and n.kind = 'membership_payment_missing'
      and n.created_at > now() - interval '7 days'
  ) then
    return;
  end if;

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (
    auth.uid(),
    'membership_payment_missing',
    'Upload your payment receipt',
    'Your TMVS application is missing payment proof. Open Member Downloads and upload your InstaPay reference, payment date, and receipt screenshot or PDF.',
    '/dashboard/downloads'
  );
end;
$$;

grant execute on function public.ensure_membership_payment_reminder() to authenticated;