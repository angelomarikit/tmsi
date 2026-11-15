-- step 11 — staff may upload public UI assets + private course/eBook PDFs

drop policy if exists public_assets_staff_insert on storage.objects;
create policy public_assets_staff_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'public-assets' and public.is_staff());

drop policy if exists public_assets_staff_update on storage.objects;
create policy public_assets_staff_update
on storage.objects for update
to authenticated
using (bucket_id = 'public-assets' and public.is_staff());

drop policy if exists public_assets_staff_delete on storage.objects;
create policy public_assets_staff_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'public-assets' and public.is_staff());

drop policy if exists private_docs_staff_insert on storage.objects;
create policy private_docs_staff_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'private-documents' and public.is_staff());

drop policy if exists private_docs_staff_update on storage.objects;
create policy private_docs_staff_update
on storage.objects for update
to authenticated
using (bucket_id = 'private-documents' and public.is_staff());

drop policy if exists private_docs_staff_read on storage.objects;
create policy private_docs_staff_read
on storage.objects for select
to authenticated
using (bucket_id = 'private-documents' and public.is_staff());

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff();
$$;

grant execute on function public.current_user_is_staff() to authenticated;