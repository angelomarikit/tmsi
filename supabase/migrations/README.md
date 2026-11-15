# Supabase migrations — manual execution only

**STOP:** The project owner runs these files in the Supabase SQL Editor. Do not assume success until you confirm.

## Order

1. `001_extensions.sql`
2. `002_core_identity.sql`
3. `003_programs_content.sql`
4. `004_applications_payments.sql`
5. `005_credentials_audit.sql`
6. `006_storage_policies.sql`
7. `007_visual_asset_slots.sql` (media_assets + cover vs material columns)
8. `008_schema_alignment.sql` (carousel columns, staff RLS, admin stats RPC)
9. `009_seed_baseline.sql` (programs, media slots, homepage CMS seeds)
10. `010_ebooks_seed.sql` (`legacy_slug` unique constraint only)
11. `011_storage_staff_upload.sql` (staff storage upload + `current_user_is_staff()`)
12. `012_program_course_materials.sql` (multiple PDFs per course via `content_items`)
13. `013_ebook_signed_urls.sql` (published eBook storage read for signed URLs)
14. `014_enrollment_rls.sql` (enrollment writes, profile trigger, receipt storage)
15. `015_student_material_access.sql` (My Learning access, student role grant RPC)
16. `016_ebook_admin_status.sql` (column comments: Review / Live / Hold ↔ content_status)
17. `017_enrollment_access_control.sql` (course_access_granted, verify/approve RPCs, notifications)
18. `018_staff_enrollment_notifications.sql` (staff in-app alert on new enrollment submit)
19. `019_user_roles_select_own.sql` (read own `user_roles`; reinforces `is_staff()`)
20. `020_admin_list_students.sql` (`admin_list_students` — student role only, excludes staff)
21. `021_membership_application_rls.sql` (TMVS membership insert/update for applicants)
22. `022_tmvs_membership_portal.sql` (TMVS username, approve RPC, downloads RLS)
23. `023_membership_queue_display.sql` (admin queue: username/name/email from payload fallback)
24. `024_membership_payment_proof.sql` (TMVS receipt upload RLS, queue payment columns, approve verifies pay)
25. `025_membership_payment_reminder.sql` (`has_payment_receipt` status + in-app upload reminder)
26. `026_enrollment_payment_reminder.sql` (dashboard enrollments `has_payment_receipt` + reminder RPC)
27. `027_membership_staff_notifications.sql` (staff in-app alert on new TMVS application)
28. `028_ebook_storage_path_repair.sql` (optional: fix `pdf_path` after seed overwrote Admin uploads)
29. `029_ebooks_reset_for_manual_upload.sql` (wipe legacy folder paths; use Admin upload only)
30. `030_clear_ebook_catalog.sql` (delete all `ebooks` rows — start empty Admin list)

## Public eBook downloads (checklist)

The website does **not** read PDFs from your PC project folders. Files must be in **Supabase Storage** (`private-documents/ebooks/{slug}.pdf`).

1. Migrations **011**, **013**, and **029** applied.
2. Admin → eBooks → **PDF** upload per title from your computer.
3. Status **Live** after **PDF in Storage** shows Ready.
4. Public `/ebooks` lists only Live titles with stored PDFs.

## After each file

Run verification queries included at the bottom of `005_credentials_audit.sql`.

## Environment (frontend)

Create `web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Never commit service role keys. Use Edge Functions or server-side tools for privileged transitions.

## Next step after your confirmation

Reply in Cursor with **"SQL applied"** (and note any errors). The agent will install `@supabase/supabase-js`, wire auth, CRUD, storage uploads, and RLS-aware queries.