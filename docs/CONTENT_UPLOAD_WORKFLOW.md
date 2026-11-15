# Content upload workflow

## Course covers (public)

- **Where:** Admin → Courses → **Cover**
- **Storage:** `public-assets`
- **Shown on:** course cards, carousel, course detail

## Course learning PDFs (private)

- **Where:** Admin → Courses → **Upload materials** → `/admin/courses/:slug/materials`
- **Storage:** `private-documents/course-materials/{slug}/`
- **Database:** `content_items` (`entity_type = leap_program`)
- **Students:** My Learning (`/learning`) after enrollment approved and payment verified

## eBooks (free public when published)

- **Where:** Admin → eBooks → **Upload & publish** → detail page
- **PDF:** private bucket `ebooks/{legacy_slug}.pdf`
- **Cover:** public bucket
- **Publish:** only after rights confirmation — unlocks public download on `/ebooks`
- **Admin list status:** Review → `under_review`, Live → `published` (+ rights), Hold → `archived`

## Never use

Diplomas, certificates, or ILRs as decorative UI or course covers.