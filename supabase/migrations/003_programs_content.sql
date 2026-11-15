-- step 3/6 — programs, ebooks, CMS, missing materials

create type public.content_status as enum (
  'draft',
  'missing',
  'uploaded',
  'under_review',
  'approved',
  'published',
  'rejected',
  'archived'
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  title text not null,
  subtitle text not null,
  description text,
  fee_php numeric(12,2) not null check (fee_php >= 0),
  cover_path text,
  sort_order int not null default 0,
  active boolean not null default true,
  publication_status public.content_status not null default 'under_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger programs_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

create table public.ebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  cover_path text,
  pdf_path text,
  sort_order int not null default 0,
  publication_status public.content_status not null default 'missing',
  rights_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ebook_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null
);

create table public.ebook_category_links (
  ebook_id uuid not null references public.ebooks (id) on delete cascade,
  category_id uuid not null references public.ebook_categories (id) on delete cascade,
  primary key (ebook_id, category_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  label text not null,
  status public.content_status not null default 'missing',
  source_path text,
  file_path text,
  reviewer_id uuid references public.profiles (id),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  publication_status public.content_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages (id) on delete cascade,
  section_key text not null,
  body jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  publication_status public.content_status not null default 'draft',
  unique (page_id, section_key)
);

alter table public.programs enable row level security;
alter table public.ebooks enable row level security;

create policy "programs_public_read_published"
on public.programs for select
using (publication_status = 'published' and active = true);

create policy "ebooks_public_read_published"
on public.ebooks for select
using (publication_status = 'published' and rights_confirmed = true);