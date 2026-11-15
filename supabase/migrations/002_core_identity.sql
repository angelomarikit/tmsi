-- step 2/6 — profiles, roles, institution settings

create type public.app_role as enum (
  'super_admin',
  'registrar',
  'content_manager',
  'student',
  'tmvs_member'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug public.app_role not null unique,
  label text not null
);

insert into public.roles (slug, label) values
  ('super_admin', 'Super Admin'),
  ('registrar', 'Registrar / Admin'),
  ('content_manager', 'Content Manager'),
  ('student', 'Student'),
  ('tmvs_member', 'TMVS Member')
on conflict (slug) do nothing;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table public.institution_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger institution_settings_updated_at
before update on public.institution_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.institution_settings enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

-- Staff policies should be refined with security definer helpers in step 5.