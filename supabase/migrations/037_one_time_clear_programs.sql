-- step 37 — one-time clear (safe WHERE clauses). Run once in SQL Editor, then add courses via Admin → Create course.

delete from public.payment_verifications pv
where exists (
  select 1
  from public.payment_submissions ps
  where ps.id = pv.payment_submission_id
    and ps.application_type = 'leap_enrollment'
);

delete from public.payment_submissions ps
where ps.application_type = 'leap_enrollment';

delete from public.enrollment_applications ea
where ea.id is not null;

delete from public.content_items ci
where ci.entity_type = 'leap_program';

delete from public.programs p
where p.id is not null;

-- Optional: Supabase Storage → private-documents → delete folder course-materials/