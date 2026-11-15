-- step 29 — clear legacy client-folder pdf_path; staff upload via Admin only

update public.ebooks
set
  pdf_path = null,
  cover_path = null,
  publication_status = 'under_review',
  rights_confirmed = false
where pdf_path is null
   or pdf_path not like 'ebooks/%';

-- Rows that already have ebooks/… in Storage keep path + you may re-Live manually if needed.