-- step 30 — remove pre-seeded eBook rows; catalog is built only via Admin Upload

delete from public.ebook_category_links
where ebook_id in (select id from public.ebooks);

delete from public.ebooks;

-- Optional: remove orphaned PDFs in Storage (Supabase UI → private-documents/ebooks/).