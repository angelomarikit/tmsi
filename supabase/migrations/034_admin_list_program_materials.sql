-- step 34 — admin list course materials (staff + slug-aware, same rows students see via 033)

create or replace function public.admin_list_program_materials(p_program_id uuid)
returns table (
  id uuid,
  label text,
  file_path text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.id,
    ci.label,
    ci.file_path,
    ci.status::text,
    ci.created_at
  from public.content_items ci
  join public.programs p_mat on p_mat.id = ci.entity_id
  join public.programs p_row on p_row.id = p_program_id
  where public.is_staff()
    and ci.entity_type = 'leap_program'
    and ci.file_path is not null
    and length(trim(ci.file_path)) > 0
    and p_mat.slug = p_row.slug
  order by ci.created_at asc;
$$;

grant execute on function public.admin_list_program_materials(uuid) to authenticated;

comment on function public.admin_list_program_materials(uuid) is
  'Staff: all learning files for a program (matched by slug). Run in SQL editor if uploads save but UI list is empty.';