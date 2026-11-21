-- step 46 — enrollment catalog matches Admin → Courses titles; hide duplicate legacy rows

-- Subtitle follows title when left blank (enrollment dropdown uses title)
update public.programs
set subtitle = title
where trim(coalesce(subtitle, '')) in ('', '—');

-- Unpublish legacy seed rows when an admin-created course shares the same CODE
update public.programs legacy
set
  publication_status = 'archived',
  active = false,
  featured_in_carousel = false
where legacy.legacy_id is not null
  and legacy.publication_status = 'published'
  and exists (
    select 1
    from public.programs newer
    where newer.legacy_id is null
      and upper(trim(newer.code)) = upper(trim(legacy.code))
      and newer.publication_status = 'published'
      and newer.id <> legacy.id
  );