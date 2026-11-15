-- step 12 — multiple private PDFs per LEAP program (content_items)

alter table public.content_items enable row level security;

create index if not exists content_items_entity_idx
  on public.content_items (entity_type, entity_id);

drop policy if exists content_items_staff_all on public.content_items;
create policy content_items_staff_all
on public.content_items for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

comment on table public.content_items is
  'Private learning files. entity_type leap_program + entity_id = programs.id. Never used as public <img>.';