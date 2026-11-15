-- step 28 — fix ebook rows where seed/migration reset pdf_path after Admin upload
-- Run after 010 if downloads show "upload PDF" despite Live status.
-- Does not upload files; only points DB at canonical paths when staff already uploaded to Storage.

update public.ebooks
set pdf_path = 'ebooks/' || legacy_slug || '.pdf'
where legacy_slug is not null
  and legacy_slug <> ''
  and coalesce(publication_status, '') = 'published'
  and coalesce(rights_confirmed, false) = true
  and (
    pdf_path is null
    or pdf_path not like 'ebooks/%'
  );

comment on table public.ebooks is
  'Public PDFs: pdf_path must match object name in private-documents bucket (e.g. ebooks/acupuncture.pdf).';