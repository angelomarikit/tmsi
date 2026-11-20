-- One-off: remove duplicate student account for Dennis O. Mindanao (run in Supabase SQL Editor as postgres).
-- After migration 044 is applied, prefer: select public.staff_delete_student_account('<uuid_to_remove>');

-- 1) Review every matching login (run first; pick the DUPLICATE row to remove — usually the newer account).
select
  p.id,
  p.email,
  p.full_name,
  p.mobile,
  p.created_at,
  (select count(*) from public.enrollment_applications ea where ea.applicant_id = p.id) as enrollments,
  (select count(*) from public.membership_applications ma where ma.applicant_id = p.id) as memberships,
  (select string_agg(r.slug::text, ', ')
   from public.user_roles ur
   join public.roles r on r.id = ur.role_id
   where ur.user_id = p.id) as roles
from public.profiles p
where p.full_name ilike '%mindanao%'
   or p.full_name ilike '%dennis%ormilla%'
   or p.email ilike '%mindanao%'
order by p.created_at;

-- 2) Delete the DUPLICATE account only (replace with the uuid from step 1).
--    Keep the account Dennis should use (often the older row, or the one with the real enrollment).
-- select public.staff_delete_student_account('00000000-0000-0000-0000-000000000000'::uuid);