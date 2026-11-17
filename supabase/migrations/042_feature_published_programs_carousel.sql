-- step 42 — show existing published LEAP courses on homepage carousel
update public.programs
set featured_in_carousel = true
where active = true
  and publication_status = 'published'
  and featured_in_carousel = false;