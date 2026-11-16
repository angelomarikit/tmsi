-- step 31 — clear legacy folder paths; staff upload via Admin → Manage materials only

update public.programs
set course_material_storage_path = null
where course_material_storage_path is not null
  and course_material_storage_path not like 'course-materials/%';

comment on column public.programs.course_material_storage_path is
  'Legacy single-file pointer — prefer content_items + Admin upload under course-materials/{slug}/.';