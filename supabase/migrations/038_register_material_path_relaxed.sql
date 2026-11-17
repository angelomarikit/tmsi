-- step 38 — allow any course-materials/ path (slug mismatch was blocking inserts after storage upload)

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
    raise exception 'staff only — add your user to user_roles (super_admin, registrar, or content_manager)';
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
  select
    v_row.id,
    v_row.label,
    v_row.file_path,
    v_row.status::text,
    v_row.created_at;
end;
$$;

grant execute on function public.staff_register_program_material(uuid, text, text) to authenticated;