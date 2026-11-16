-- step 9/9 — seed LEAP programs, visual slots, homepage CMS (idempotent)

insert into public.ebook_categories (slug, label) values
  ('philosophical', 'Philosophical'),
  ('metaphysical', 'Metaphysical'),
  ('transcendental', 'Transcendental'),
  ('holistic', 'Holistic')
on conflict (slug) do nothing;

insert into public.site_pages (slug, title, publication_status) values
  ('home', 'Homepage', 'published')
on conflict (slug) do nothing;

insert into public.page_sections (page_id, section_key, body, sort_order, publication_status)
select p.id, v.section_key, v.body, v.sort_order, 'published'::public.content_status
from public.site_pages p
cross join (
  values
    ('hero_title', '{"text":"Illuminating Minds. Advancing Lifelong Learning."}'::jsonb, 1),
    ('hero_subtitle', '{"text":"TMSI–Luminarian Academy of Philosophical Studies offers independent, transformative, and holistic education through lifelong learning in metaphysical science, philosophy, vitalogy, and integrative well-being."}'::jsonb, 2),
    ('about_teaser', '{"title":"About TMSI–LAPS","text":"TMSI–Luminarian Academy of Philosophical Studies is an independent institution devoted to lifelong learning, metaphysical inquiry, philosophical development and transcendental education."}'::jsonb, 3),
    ('leap_teaser', '{"title":"LEAP","text":"Lifelong Education Advancement Program (LEAP) is the Academy''s self-paced digital-correspondence pathway for adult learners and practitioners."}'::jsonb, 4)
) as v(section_key, body, sort_order)
where p.slug = 'home'
on conflict (page_id, section_key) do update
set body = excluded.body,
    publication_status = excluded.publication_status;

insert into public.institution_settings (key, value, approved) values
  (
    'homepage_hero',
    '{"cta_enroll_label":"Enroll Now","cta_ebooks_label":"Free eBooks"}'::jsonb,
    true
  ),
  (
    'payment_metrobank',
    '{"bank":"Metrobank","payee":"Raul Cardona","network":"InstaPay","qr_asset_key":"payment.metrobank_qr"}'::jsonb,
    false
  )
on conflict (key) do update
set value = excluded.value;

-- Visual asset slots (mirrors src/data/visual-assets.ts)
insert into public.media_assets (asset_key, category, public_path, cms_label, approval_status)
values
  ('brand.logo', 'brand', '/assets/brand/logo.jpg', 'Institutional logo', 'published'),
  ('homepage.hero.banner', 'website_visual', '/assets/website-visual/homepage-hero-banner.jpg', 'Homepage hero banner', 'published'),
  ('masthead.background', 'website_visual', '/assets/website-visual/masthead-background.png', 'Masthead background', 'published'),
  ('course.dms', 'course_cover', '/assets/course-covers/dms.jpg', 'Course cover — DMS', 'published'),
  ('course.dms_tin', 'course_cover', '/assets/course-covers/dms-tin.jpg', 'Course cover — DMS-TIN', 'published'),
  ('course.phd_ticm', 'course_cover', '/assets/course-covers/phd-ticm.jpg', 'Course cover — PhD-TICM', 'published'),
  ('course.dms_vitalogy', 'course_cover', '/assets/course-covers/dms-vitalogy.jpg', 'Course cover — DMS-Vitalogy', 'published'),
  ('course.dms_llvt', 'course_cover', '/assets/course-covers/dms-llvt.jpg', 'Course cover — DMS-LLVT', 'published'),
  ('course.tph_cert', 'course_cover', '/assets/course-covers/tph-cert.jpg', 'Course cover — Transcendentalism-PH', 'published'),
  ('course.luminarian_order', 'course_cover', '/assets/website-visual/luminarian-symbol.jpg', 'Course cover — Luminarian Order', 'published'),
  ('course.lecs_dip', 'course_cover', '/assets/course-covers/lecs-dip.jpg', 'Course cover — LECS Diplomate', 'published'),
  ('course.lecs_fel', 'course_cover', '/assets/course-covers/lecs-fel.jpg', 'Course cover — LECS Fellow', 'published'),
  ('payment.metrobank_qr', 'payment', '/assets/payment/metrobank-instaPay-qr.png', 'Metrobank QR', 'published')
on conflict (asset_key) do update
set public_path = excluded.public_path,
    approval_status = excluded.approval_status,
    cms_label = excluded.cms_label;

-- LEAP programs (fees and flags match programs.ts)
insert into public.programs (
  legacy_id, code, slug, title, subtitle, description, fee_php,
  cover_asset_key, carousel_cover_path, course_material_storage_path,
  featured_in_carousel, footer_strip, sort_order, active, publication_status
) values
  ('dms', 'DMS', 'doctor-of-metaphysical-science', 'DMS', 'Doctor of Metaphysical Science',
   'Metaphysical philosophy, consciousness, transcendentalism and Luminarian thought.', 14000,
   'course.dms', '/assets/course-covers/carousel/dms.jpg', null, true, false, 1, true, 'published'),
  ('dms-tin', 'DMS-TIN', 'dms-transpersonal-integrative-naturopathy', 'DMS-TIN', 'DMS in Transpersonal Integrative Naturopathy',
   'Transpersonal perspectives on integrative naturopathy and holistic well-being.', 14000,
   'course.dms_tin', '/assets/course-covers/dms-tin.jpg', null, true, false, 2, true, 'published'),
  ('phd-ticm', 'PhD-TICM', 'phd-transpersonal-integrative-complementary-medicine', 'PhD-TICM', 'PhD in Transpersonal Integrative Complementary Medicine',
   'Advanced philosophical inquiry into complementary medicine and integrative approaches.', 14000,
   'course.phd_ticm', '/assets/course-covers/carousel/phd-ticm.jpg', null, true, false, 3, true, 'published'),
  ('dms-vitalogy', 'DMS-Vitalogy', 'dms-vitalogy', 'DMS-Vitalogy', 'Doctor of Metaphysical Science in Vitalogy',
   'DMS-Vitalogy, vitality concepts and holistic lifestyle education.', 18000,
   'course.dms_vitalogy', '/assets/course-covers/dms-vitalogy.jpg', null, true, false, 4, true, 'published'),
  ('dms-llvt', 'DMS-LLVT', 'dms-luminarian-light-vitality-therapy', 'DMS-LLVT', 'Luminarian Light and Vitality Therapy',
   'Luminarian Light and Vitality Therapy, consciousness and contemplative practices.', 7500,
   'course.dms_llvt', '/assets/course-covers/dms-llvt.jpg', null, true, false, 5, true, 'published'),
  ('tph-cert', 'TPH-CERT', 'certificate-philosophy-transcendentalism-ph', 'Transcendentalism-PH Certificate', 'Certificate in the Philosophy of Transcendentalism-PH',
   'Foundations and philosophy of Transcendentalism-PH.', 3500,
   'course.tph_cert', null, null, true, true, 6, true, 'published'),
  ('luminarian-order', 'LUM-ORDER', 'luminarian-order', 'The Luminarian Order', 'Levels I, II and III',
   'A three-level pathway in Luminarian philosophical learning and recognition.', 3750,
   'course.luminarian_order', null, null, true, true, 7, true, 'published'),
  ('lecs-dip', 'LECS-DIP', 'lecs-diplomate-metaphysical-healing-art', 'LECS — Diplomate', 'Diplomate in Metaphysical Healing Art',
   'Evaluation of documented experiential learning in metaphysical healing arts.', 6500,
   'course.lecs_dip', null, null, true, true, 8, true, 'published'),
  ('lecs-fel', 'LECS-FEL', 'lecs-fellow-metaphysical-healing-arts', 'LECS — Fellow', 'Fellow in Metaphysical Healing Arts',
   'Advanced institutional evaluation of experience and contributions in metaphysical healing arts.', 8750,
   'course.lecs_fel', null, null, true, true, 9, true, 'published')
on conflict (slug) do update set
  fee_php = excluded.fee_php,
  cover_asset_key = excluded.cover_asset_key,
  carousel_cover_path = excluded.carousel_cover_path,
  course_material_storage_path = coalesce(
    programs.course_material_storage_path,
  excluded.course_material_storage_path
  ),
  featured_in_carousel = excluded.featured_in_carousel,
  footer_strip = excluded.footer_strip,
  publication_status = excluded.publication_status;