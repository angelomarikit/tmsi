-- step 13 — public eBook catalog + private PDF read via storage RLS (for signed URLs)

drop policy if exists ebooks_public_read_published on public.ebooks;
create policy ebooks_public_read_published
on public.ebooks for select
to anon, authenticated
using (publication_status = 'published' and rights_confirmed = true);

drop policy if exists private_docs_ebook_public_read on storage.objects;
create policy private_docs_ebook_public_read
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'private-documents'
  and exists (
    select 1
    from public.ebooks e
    where e.pdf_path = name
      and e.publication_status = 'published'
      and e.rights_confirmed = true
      and e.pdf_path is not null
  )
);