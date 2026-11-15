-- step 15 — enrolled learners read content_items + course PDFs in storage

create or replace function public.user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollment_applications ea
    where ea.applicant_id = p_user_id
      and ea.program_id = p_program_id
      and ea.status = 'approved'
      and exists (
        select 1
        from public.payment_submissions ps
        where ps.application_id = ea.id
          and ps.application_type = 'leap_enrollment'
          and ps.status = 'verified'
      )
  );
$$;

grant execute on function public.user_has_program_access(uuid, uuid) to authenticated;

create or replace function public.current_user_is_student()
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
      and r.slug = 'student'
  );
$$;

grant execute on function public.current_user_is_student() to authenticated, anon;

create or replace function public.grant_student_role(p_user_id uuid)
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
  select id into v_role_id from public.roles where slug = 'student';
  if v_role_id is null then
  raise exception 'student role missing';
  end if;
  insert into public.user_roles (user_id, role_id)
  values (p_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

grant execute on function public.grant_student_role(uuid) to authenticated;

drop policy if exists content_items_student_read on public.content_items;
create policy content_items_student_read
on public.content_items for select
to authenticated
using (
  entity_type = 'leap_program'
  and entity_id is not null
  and status in ('published', 'uploaded')
  and (
    public.is_staff()
    or public.user_has_program_access(auth.uid(), entity_id)
  )
);

drop policy if exists private_docs_course_material_read on storage.objects;
create policy private_docs_course_material_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = 'course-materials'
  and exists (
    select 1
    from public.content_items ci
    where ci.file_path = name
      and ci.entity_type = 'leap_program'
      and ci.status in ('published', 'uploaded')
      and (
        public.is_staff()
        or public.user_has_program_access(auth.uid(), ci.entity_id)
      )
  )
);

-- Approved programs list for learning home
create or replace function public.list_my_enrolled_programs()
returns table (
  program_id uuid,
  slug text,
  title text,
  subtitle text,
  reference_code text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.title,
    p.subtitle,
    ea.reference_code
  from public.enrollment_applications ea
  join public.programs p on p.id = ea.program_id
  where ea.applicant_id = auth.uid()
    and ea.status = 'approved'
    and public.user_has_program_access(auth.uid(), p.id)
  order by ea.submitted_at desc nulls last;
$$;

grant execute on function public.list_my_enrolled_programs() to authenticated;