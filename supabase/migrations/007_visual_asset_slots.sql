-- step 7 (optional, after 001-006) — explicit public visual asset slots

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  category text not null check (
    category in ('brand', 'website_visual', 'course_cover', 'ebook_cover', 'payment')
  ),
  public_path text,
  storage_path text,
  cms_label text not null,
  approval_status public.content_status not null default 'draft',
  assigned_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

alter table public.programs add column if not exists cover_asset_key text;
alter table public.programs add column if not exists course_material_storage_path text;

alter table public.ebooks add column if not exists cover_asset_key text;
-- pdf_path remains private learning/download file; never exposed as cover

comment on column public.programs.cover_asset_key is 'References media_assets.asset_key for promotional cover only';
comment on column public.programs.course_material_storage_path is 'Private PDF modules — not used in public img';