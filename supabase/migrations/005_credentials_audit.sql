-- step 5/6 — credentials, audit, client approvals

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  credential_type text not null,
  status text not null default 'issued',
  file_path text,
  issued_by uuid references public.profiles (id),
  issued_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.client_approval_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  description text not null,
  approved boolean not null default false,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  notes text
);

insert into public.client_approval_items (item_key, description) values
  ('metrobank_qr', 'Official Metrobank QR and payee for tuition/membership'),
  ('ebook_rights', 'Distribution rights for 17 PDF eBooks'),
  ('physical_tmvs_package', 'Public offer of ₱2,875 physical TMVS package'),
  ('regulatory_copy', 'Final regulatory disclosure wording')
on conflict (item_key) do nothing;

alter table public.credentials enable row level security;
alter table public.audit_logs enable row level security;
alter table public.client_approval_items enable row level security;

-- Verification queries (run after all migrations):
-- select count(*) from public.programs;
-- select slug, approved from public.client_approval_items order by item_key;
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;