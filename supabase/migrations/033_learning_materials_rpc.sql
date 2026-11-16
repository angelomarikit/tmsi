-- step 33 — learner course materials via RPC (access check + slug-aware entity match)

create or replace function public.list_learning_materials_for_program(p_program_id uuid)
returns table (
  id uuid,
  label text,
  file_path text,
  status text
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
    ci.status::text
  from public.content_items ci
  join public.programs p_mat on p_mat.id = ci.entity_id
  join public.programs p_enroll on p_enroll.id = p_program_id
  where public.user_has_program_access(auth.uid(), p_program_id)
    and ci.entity_type = 'leap_program'
    and ci.status in ('published', 'uploaded')
    and ci.file_path is not null
    and length(trim(ci.file_path)) > 0
    and p_mat.slug = p_enroll.slug
  order by ci.created_at asc;
$$;

grant execute on function public.list_learning_materials_for_program(uuid) to authenticated;

comment on function public.list_learning_materials_for_program(uuid) is
  'Returns published LEAP materials for an enrolled program. Matches content_items by program slug so uploads tied to a duplicate programs row still appear.';