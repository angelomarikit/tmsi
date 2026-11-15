-- step 6/6 — storage buckets (adjust in Dashboard if bucket API differs)

insert into storage.buckets (id, name, public)
values
  ('public-assets', 'public-assets', true),
  ('private-documents', 'private-documents', false)
on conflict (id) do nothing;

-- Policies must be tightened with role helpers; baseline:

create policy "public_assets_read"
on storage.objects for select
using (bucket_id = 'public-assets');

create policy "private_docs_owner_read"
on storage.objects for select
using (
  bucket_id = 'private-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);