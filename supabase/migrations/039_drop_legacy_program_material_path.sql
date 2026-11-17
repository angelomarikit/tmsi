-- step 39 — LEAP materials use content_items only (not programs.course_material_storage_path)

update public.programs
set course_material_storage_path = null
where course_material_storage_path is not null;

comment on column public.programs.course_material_storage_path is
  'Deprecated — ignored by the app. Upload via Admin → Courses → Manage (content_items + private-documents/course-materials/).';