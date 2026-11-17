-- step 40 — explain why PDF upload fails (staff role, RPC, RLS)

create or replace function public.admin_probe_course_materials_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_staff boolean;
  v_count bigint;
  v_roles text[];
  v_has_register boolean;
  v_has_reset boolean;
begin
  v_staff := public.is_staff();

  select coalesce(array_agg(r.slug order by r.slug), '{}')
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
    where n.nspname = 'public'
      and p.proname = 'staff_register_program_material'
  ) into v_has_register;

  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'staff_reset_leap_catalog'
  ) into v_has_reset;

  return jsonb_build_object(
    'is_staff', v_staff,
    'uid', auth.uid(),
    'role_slugs', v_roles,
    'leap_material_rows', v_count,
    'has_staff_register_program_material', v_has_register,
    'has_staff_reset_leap_catalog', v_has_reset,
    'upload_requires',
    jsonb_build_array(
      'user_roles: super_admin, registrar, or content_manager',
      'migrations 011 (storage), 012 (content_items RLS), 035/038 (register RPC)',
      'private-documents bucket + course-materials/{slug}/ path'
    )
  );
end;
$$;

grant execute on function public.admin_probe_course_materials_access() to authenticated;