-- step 8/9 — align schema with React app (programs, CMS, admin RLS)

-- Matches LeapProgram in src/data/programs.ts
alter table public.programs
  add column if not exists legacy_id text,
  add column if not exists featured_in_carousel boolean not null default false,
  add column if not exists carousel_cover_path text,
  add column if not exists footer_strip boolean not null default false;

create unique index if not exists programs_legacy_id_key
  on public.programs (legacy_id)
  where legacy_id is not null;

comment on column public.programs.legacy_id is 'Stable id from seed (e.g. dms, lecs-fel) for imports';
comment on column public.programs.cover_asset_key is 'Key in media_assets.asset_key';

-- Staff gate used by RLS (super_admin, registrar, content_manager)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in ('super_admin', 'registrar', 'content_manager')
  );
$$;

grant execute on function public.is_staff() to authenticated, anon;

-- media_assets (from 007)
alter table public.media_assets enable row level security;

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read
on public.media_assets for select
to anon, authenticated
using (approval_status = 'published' and public_path is not null);

drop policy if exists media_assets_staff_manage on public.media_assets;
create policy media_assets_staff_manage
on public.media_assets for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Programs: staff sees drafts; public sees published (existing policy)
drop policy if exists programs_staff_read on public.programs;
create policy programs_staff_read
on public.programs for select
to authenticated
using (public.is_staff());

drop policy if exists programs_staff_write on public.programs;
create policy programs_staff_write
on public.programs for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- eBooks
alter table public.ebooks enable row level security;

drop policy if exists ebooks_staff_read on public.ebooks;
create policy ebooks_staff_read
on public.ebooks for select
to authenticated
using (public.is_staff());

drop policy if exists ebooks_staff_write on public.ebooks;
create policy ebooks_staff_write
on public.ebooks for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Site CMS (homepage / static pages)
alter table public.site_pages enable row level security;
alter table public.page_sections enable row level security;

drop policy if exists site_pages_public_read on public.site_pages;
create policy site_pages_public_read
on public.site_pages for select
to anon, authenticated
using (publication_status = 'published');

drop policy if exists page_sections_public_read on public.page_sections;
create policy page_sections_public_read
on public.page_sections for select
to anon, authenticated
using (publication_status = 'published');

drop policy if exists site_pages_staff on public.site_pages;
create policy site_pages_staff
on public.site_pages for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists page_sections_staff on public.page_sections;
create policy page_sections_staff
on public.page_sections for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Institution settings: public read for approved homepage/payment keys only
drop policy if exists institution_settings_public_home on public.institution_settings;
create policy institution_settings_public_home
on public.institution_settings for select
to anon, authenticated
using (
  approved = true
  and key in ('homepage_hero', 'homepage_about', 'homepage_leap', 'payment_metrobank')
);

drop policy if exists institution_settings_staff on public.institution_settings;
create policy institution_settings_staff
on public.institution_settings for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Admin aggregates (staff only; returns one row)
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_staff() then
    return null;
  end if;

  select jsonb_build_object(
    'students',
      (select count(distinct ur.user_id)
       from public.user_roles ur
       join public.roles r on r.id = ur.role_id
       where r.slug = 'student'),
    'members',
      (select count(distinct ur.user_id)
       from public.user_roles ur
       join public.roles r on r.id = ur.role_id
       where r.slug = 'tmvs_member'),
    'pending_applications',
      (select count(*) from public.enrollment_applications
       where status in ('submitted', 'under_review')),
    'pending_payments',
      (select count(*) from public.payment_submissions
       where status in ('submitted', 'pending_verification')),
    'missing_materials',
      (select count(*) from public.content_items
       where status in ('missing', 'rejected')),
    'published_ebooks',
      (select count(*) from public.ebooks
       where publication_status = 'published' and rights_confirmed = true),
    'published_programs',
      (select count(*) from public.programs
       where publication_status = 'published' and active = true)
  )
  into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;