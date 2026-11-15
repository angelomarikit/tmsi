-- step 4/6 — enrollment, TMVS, payments

create type public.application_type as enum ('leap_enrollment', 'tmvs_membership');
create type public.application_status as enum (
  'draft',
  'submitted',
  'correction_requested',
  'under_review',
  'approved',
  'rejected'
);

create type public.payment_status as enum (
  'submitted',
  'pending_verification',
  'verified',
  'rejected',
  'duplicate_flagged'
);

create table public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references public.profiles (id),
  program_id uuid not null references public.programs (id),
  status public.application_status not null default 'draft',
  reference_code text unique,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references public.profiles (id),
  package_code text not null default 'digital',
  status public.application_status not null default 'draft',
  reference_code text unique,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  application_type public.application_type not null,
  application_id uuid not null,
  declared_amount numeric(12,2) not null,
  reference_number text not null,
  receipt_path text not null,
  payment_date date,
  status public.payment_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create unique index payment_submissions_reference_unique
on public.payment_submissions (lower(reference_number));

create table public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  payment_submission_id uuid not null references public.payment_submissions (id) on delete cascade,
  verified_amount numeric(12,2),
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  reviewer_notes text,
  status public.payment_status not null,
  created_at timestamptz not null default now()
);

alter table public.enrollment_applications enable row level security;
alter table public.membership_applications enable row level security;
alter table public.payment_submissions enable row level security;
alter table public.payment_verifications enable row level security;

create policy "enrollment_select_own"
on public.enrollment_applications for select
using (auth.uid() = applicant_id);

create policy "membership_select_own"
on public.membership_applications for select
using (auth.uid() = applicant_id);

create policy "payment_select_own_via_enrollment"
on public.payment_submissions for select
using (false); -- replace with join policies after helper functions in production hardening