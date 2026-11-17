-- step 41 — "admin upload" = super_admin | registrar | content_manager (not a separate staff role)

comment on function public.is_staff() is
  'Admin upload access: true when user has super_admin, registrar, or content_manager in user_roles.';

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff();
$$;

grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.admin_probe_course_materials_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_admin boolean;
  v_count bigint;
  v_roles text[];
  v_email text;
  v_has_register boolean;
  v_has_reset boolean;
begin
  v_admin := public.is_staff();

  select u.email into v_email from auth.users u where u.id = auth.uid();

  select coalesce(array_agg(r.slug::text order by r.slug), '{}')
  into v_roles
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();

  select count(*) into v_count
  from public.content_items
  where entity_type = 'leap_program';

  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'staff_register_program_material'
  ) into v_has_register;

  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'staff_reset_leap_catalog'
  ) into v_has_reset;

  return jsonb_build_object(
    'is_admin', v_admin,
    'is_staff', v_admin,
    'email', v_email,
    'uid', auth.uid(),
    'role_slugs', v_roles,
    'leap_material_rows', v_count,
    'has_staff_register_program_material', v_has_register,
    'has_staff_reset_leap_catalog', v_has_reset,
    'upload_roles', jsonb_build_array('super_admin', 'registrar', 'content_manager')
  );
end;
$$;

grant execute on function public.admin_probe_course_materials_access() to authenticated;

create or replace function public.staff_register_program_material(
  p_program_id uuid,
  p_label text,
  p_file_path text
)
returns table (
  id uuid,
  label text,
  file_path text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.content_items%rowtype;
begin
  if not public.is_staff() then
    raise exception 'admin only — assign user_roles.super_admin (or registrar / content_manager)';
  end if;

  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'program not found for id %', p_program_id;
  end if;

  if p_file_path is null or length(trim(p_file_path)) = 0 then
    raise exception 'file_path is required';
  end if;

  if p_file_path not like 'course-materials/%' then
    raise exception 'file_path must start with course-materials/';
  end if;

  insert into public.content_items (
    entity_type,
    entity_id,
    label,
    file_path,
    status
  )
  values (
    'leap_program',
    p_program_id,
    coalesce(nullif(trim(p_label), ''), split_part(p_file_path, '/', -1)),
    p_file_path,
    'published'
  )
  returning * into v_row;

  return query
  select v_row.id, v_row.label, v_row.file_path, v_row.status::text, v_row.created_at;
end;
$$;