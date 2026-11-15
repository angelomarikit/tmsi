-- step 16 — document admin eBook status UI ↔ content_status

comment on column public.ebooks.publication_status is
  'content_status enum. Admin UI: Review=under_review, Live=published (+ rights_confirmed), Hold=archived';

comment on column public.ebooks.rights_confirmed is
  'Required with publication_status=published for public download (013 RLS).';