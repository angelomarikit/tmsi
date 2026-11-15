-- step 10 — legacy_slug for Admin uploads (no pre-loaded titles; use Admin → Upload)

alter table public.ebooks add column if not exists legacy_slug text;

-- ON CONFLICT (legacy_slug) needs a table UNIQUE constraint (not a standalone partial index).
alter table public.ebooks drop constraint if exists ebooks_legacy_slug_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ebooks_legacy_slug_key'
      and conrelid = 'public.ebooks'::regclass
  ) then
    alter table public.ebooks
      add constraint ebooks_legacy_slug_key unique (legacy_slug);
  end if;
end $$;

-- Titles are inserted only through the web Admin (Upload new eBook).