-- step 21 — TMVS membership submit (authenticated applicants + staff review)

drop policy if exists membership_insert_own on public.membership_applications;
create policy membership_insert_own
on public.membership_applications for insert
to authenticated
with check (applicant_id = auth.uid());

drop policy if exists membership_update_own on public.membership_applications;
create policy membership_update_own
on public.membership_applications for update
to authenticated
using (applicant_id = auth.uid())
with check (applicant_id = auth.uid());

drop policy if exists membership_staff_all on public.membership_applications;
create policy membership_staff_all
on public.membership_applications for all
to authenticated
using (public.is_staff())
with check (public.is_staff());