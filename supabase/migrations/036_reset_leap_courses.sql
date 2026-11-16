-- step 36 — staff wipe LEAP catalog (programs + materials + enrollments). Manual re-seed with 009 or Admin Upload.

create or replace function public.staff_reset_leap_catalog(p_confirm text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay_ver int := 0;
  v_pay int := 0;
  v_enroll int := 0;
  v_items int := 0;
  v_programs int := 0;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;

  if coalesce(trim(p_confirm), '') <> 'RESET' then
    raise exception 'Type RESET to confirm wiping all programs, course PDFs metadata, and LEAP enrollments';
  end if;

  delete from public.payment_verifications pv
  using public.payment_submissions ps
  where pv.payment_submission_id = ps.id
    and ps.application_type = 'leap_enrollment';
  get diagnostics v_pay_ver = row_count;

  delete from public.payment_submissions ps
  where ps.application_type = 'leap_enrollment';
  get diagnostics v_pay = row_count;

  delete from public.enrollment_applications ea
  where ea.id is not null;
  get diagnostics v_enroll = row_count;

  delete from public.content_items
  where entity_type = 'leap_program';
  get diagnostics v_items = row_count;

  delete from public.programs p
  where p.id is not null;
  get diagnostics v_programs = row_count;

  return jsonb_build_object(
    'programs_deleted', v_programs,
    'content_items_deleted', v_items,
    'enrollments_deleted', v_enroll,
    'payment_submissions_deleted', v_pay,
    'payment_verifications_deleted', v_pay_ver,
    'storage_note',
    'Delete objects under Storage → private-documents → course-materials/ in Supabase UI (not automatic).'
  );
end;
$$;

grant execute on function public.staff_reset_leap_catalog(text) to authenticated;

comment on function public.staff_reset_leap_catalog(text) is
  'Destructive: removes all programs, leap_program content_items, and LEAP enrollment/payment rows. Pass RESET. Re-import via 009 or Admin + Upload.';