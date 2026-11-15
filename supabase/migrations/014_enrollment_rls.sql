-- step 14 — enrollment writes, profile bootstrap, payment + receipt storage

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "payment_select_own_via_enrollment" on public.payment_submissions;
create policy payment_select_own_via_enrollment
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
);

drop policy if exists enrollment_insert_own on public.enrollment_applications;
create policy enrollment_insert_own
on public.enrollment_applications for insert
to authenticated
with check (applicant_id = auth.uid());

drop policy if exists enrollment_update_own on public.enrollment_applications;
create policy enrollment_update_own
on public.enrollment_applications for update
to authenticated
using (applicant_id = auth.uid())
with check (applicant_id = auth.uid());

drop policy if exists enrollment_staff_all on public.enrollment_applications;
create policy enrollment_staff_all
on public.enrollment_applications for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists payment_insert_own on public.payment_submissions;
create policy payment_insert_own
on public.payment_submissions for insert
to authenticated
with check (
  exists (
    select 1
    from public.enrollment_applications ea
    where ea.id = payment_submissions.application_id
      and ea.applicant_id = auth.uid()
  )
);

drop policy if exists payment_staff_all on public.payment_submissions;
create policy payment_staff_all
on public.payment_submissions for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists private_docs_receipt_insert on storage.objects;
create policy private_docs_receipt_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = 'enrollment-receipts'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists private_docs_receipt_read on storage.objects;
create policy private_docs_receipt_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = 'enrollment-receipts'
  and (
    public.is_staff()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);