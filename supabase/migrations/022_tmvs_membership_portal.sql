-- step 22 — TMVS member portal: username, access flag, downloads RLS, staff approve

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

alter table public.membership_applications
  add column if not exists membership_access_granted boolean not null default false,
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists approved_at timestamptz,
  add column if not exists admin_notes text;

create or replace function public.user_has_tmvs_membership_access(p_user_id uuid default auth.uid())
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
    where ur.user_id = p_user_id
      and r.slug = 'tmvs_member'
  )
  and exists (
    select 1
    from public.membership_applications ma
    where ma.applicant_id = p_user_id
      and ma.status = 'approved'
      and ma.membership_access_granted = true
  );
$$;

grant execute on function public.user_has_tmvs_membership_access(uuid) to authenticated;

create or replace function public.current_user_is_tmvs_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_tmvs_membership_access(auth.uid());
$$;

grant execute on function public.current_user_is_tmvs_member() to authenticated, anon;

create or replace function public.grant_tmvs_member_role(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  select id into v_role_id from public.roles where slug = 'tmvs_member';
  if v_role_id is null then
    raise exception 'tmvs_member role missing';
  end if;
  insert into public.user_roles (user_id, role_id)
  values (p_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

grant execute on function public.grant_tmvs_member_role(uuid) to authenticated;

create or replace function public.my_membership_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'application_id', ma.id,
        'reference_code', ma.reference_code,
        'status', ma.status::text,
        'membership_access_granted', ma.membership_access_granted,
        'submitted_at', ma.submitted_at,
        'approved_at', ma.approved_at
      )
      from public.membership_applications ma
      where ma.applicant_id = auth.uid()
      order by ma.submitted_at desc nulls last, ma.created_at desc
      limit 1
    ),
    'null'::jsonb
  );
$$;

grant execute on function public.my_membership_status() to authenticated;

drop policy if exists content_items_tmvs_member_read on public.content_items;
create policy content_items_tmvs_member_read
on public.content_items for select
to authenticated
using (
  entity_type = 'tmvs_membership'
  and status in ('published', 'uploaded')
  and (
    public.is_staff()
    or public.user_has_tmvs_membership_access(auth.uid())
  )
);

drop policy if exists content_items_tmvs_staff_all on public.content_items;
create policy content_items_tmvs_staff_all
on public.content_items for all
to authenticated
using (entity_type = 'tmvs_membership' and public.is_staff())
with check (entity_type = 'tmvs_membership' and public.is_staff());

drop policy if exists private_docs_membership_material_read on storage.objects;
create policy private_docs_membership_material_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = 'membership-materials'
  and exists (
    select 1
    from public.content_items ci
    where ci.file_path = name
      and ci.entity_type = 'tmvs_membership'
      and ci.status in ('published', 'uploaded')
      and (
        public.is_staff()
        or public.user_has_tmvs_membership_access(auth.uid())
      )
  )
);

create or replace function public.admin_list_membership_applications()
returns table (
  id uuid,
  applicant_id uuid,
  reference_code text,
  status text,
  membership_access_granted boolean,
  package_code text,
  submitted_at timestamptz,
  approved_at timestamptz,
  admin_notes text,
  payload jsonb,
  email text,
  full_name text,
  username text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ma.id,
    ma.applicant_id,
    ma.reference_code,
    ma.status::text,
    ma.membership_access_granted,
    ma.package_code,
    ma.submitted_at,
    ma.approved_at,
    ma.admin_notes,
    ma.payload,
    coalesce(nullif(trim(p.email), ''), nullif(trim(ma.payload->>'email'), '')) as email,
    coalesce(nullif(trim(p.full_name), ''), nullif(trim(ma.payload->>'fullName'), '')) as full_name,
    coalesce(nullif(trim(p.username), ''), nullif(trim(ma.payload->>'username'), '')) as username
  from public.membership_applications ma
  left join public.profiles p on p.id = ma.applicant_id
  where public.is_staff()
  order by ma.submitted_at desc nulls last, ma.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_membership_applications() to authenticated;

create or replace function public.admin_list_tmvs_members()
returns table (
  profile_id uuid,
  email text,
  full_name text,
  username text,
  reference_code text,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.username,
    ma.reference_code,
    ma.approved_at
  from public.membership_applications ma
  join public.profiles p on p.id = ma.applicant_id
  where public.is_staff()
    and ma.status = 'approved'
    and ma.membership_access_granted = true
  order by ma.approved_at desc nulls last;
$$;

grant execute on function public.admin_list_tmvs_members() to authenticated;

create or replace function public.admin_membership_approval_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    return null;
  end if;
  return jsonb_build_object(
    'pending', (select count(*) from membership_applications where status in ('submitted', 'under_review')),
    'approved', (select count(*) from membership_applications where status = 'approved'),
    'corrections', (select count(*) from membership_applications where status = 'correction_requested'),
    'rejected', (select count(*) from membership_applications where status = 'rejected')
  );
end;
$$;

grant execute on function public.admin_membership_approval_stats() to authenticated;

create or replace function public.staff_approve_membership(p_application_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  select applicant_id into v_applicant
  from membership_applications where id = p_application_id;
  if v_applicant is null then
    raise exception 'application not found';
  end if;

  update membership_applications
  set status = 'approved',
      membership_access_granted = true,
      approved_by = auth.uid(),
      approved_at = now(),
      admin_notes = coalesce(p_notes, admin_notes)
  where id = p_application_id;

  perform public.grant_tmvs_member_role(v_applicant);

  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (
    v_applicant,
    'membership_approved',
    'TMVS membership approved',
    'Your membership has been approved. Sign in and open Downloads for member materials.',
    '/dashboard/downloads'
  );

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'membership_approved',
    'membership_application',
    p_application_id,
    jsonb_build_object('notes', p_notes)
  );
end;
$$;

grant execute on function public.staff_approve_membership(uuid, text) to authenticated;

create or replace function public.staff_reject_membership(p_application_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select applicant_id into v_applicant from membership_applications where id = p_application_id;
  update membership_applications
  set status = 'rejected', membership_access_granted = false, admin_notes = p_reason
  where id = p_application_id;
  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (v_applicant, 'membership_rejected', 'Membership not approved', p_reason, '/membership');
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'membership_rejected', 'membership_application', p_application_id, jsonb_build_object('reason', p_reason));
end;
$$;

grant execute on function public.staff_reject_membership(uuid, text) to authenticated;

create or replace function public.staff_request_membership_correction(p_application_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select applicant_id into v_applicant from membership_applications where id = p_application_id;
  update membership_applications
  set status = 'correction_requested', membership_access_granted = false, admin_notes = p_message
  where id = p_application_id;
  insert into in_app_notifications (user_id, kind, title, body, link_path)
  values (v_applicant, 'membership_correction', 'Correction required', p_message, '/membership');
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'membership_correction', 'membership_application', p_application_id, jsonb_build_object('message', p_message));
end;
$$;

grant execute on function public.staff_request_membership_correction(uuid, text) to authenticated;