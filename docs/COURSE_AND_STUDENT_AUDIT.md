# Course catalog & student portal audit (fresh-start mode)

**Policy:** No bundled legacy LEAP courses in the app. All courses come from **Supabase `programs`** via **Admin → Create course**. Run **`037_one_time_clear_programs.sql`** once if you need an empty catalog.

## Public website

| Area | Behavior | Depends on |
|------|----------|------------|
| `/courses` | Lists **published** programs from DB only | `programs` table |
| `/courses/:slug` | Detail page; 404 if slug not in DB | Same |
| Homepage carousel | Only programs with `featured_in_carousel` | Toggle when creating/editing (future) / DB column |
| Enroll / purchase modal | Dropdown of DB programs; submits `program_id` UUID | Staff-created rows |
| Covers | `programs.cover_path` (Admin upload) or visual asset key fallback | Create course optional cover |

**Empty catalog:** Catalogue and carousel show empty / “check back” until you **Create course** and set **publication_status = published**.

## Admin

| Action | Result |
|--------|--------|
| **Create course** | Inserts `programs` + optional PDFs → `content_items` + Storage |
| **Edit / Manage** | PDFs via `content_items`; slug-aware list (migrations 034–035) |
| **Verify / Approve enrollment** | Required before student materials |
| SQL **037** | One-time delete of all programs & LEAP enrollments |

Required Supabase migrations for materials: **011, 012, 033, 034, 035** (+ **037** for wipe).

## Student account (`/dashboard`)

| Step | What student sees |
|------|-------------------|
| Register / login | Student role after signup flow |
| Purchase course | Modal → enrollment application + receipt upload |
| My Courses | Rows from `fetchStudentDashboardEnrollments` (approved/pending) |
| Payment receipt | Required before admin can verify pay |
| Continue learning `/dashboard/courses/:id` | After **payment verified** + **enrollment approved** → RPC **033** lists PDFs |
| TMVS | Separate membership flow; not tied to LEAP catalog |

**Common “no materials” causes:** PDF not in `content_items`, migrations 033 missing, enrollment not approved, payment not verified, or wrong `program_id` on enrollment.

## Checklist before go-live (one course)

1. Run **037** (if resetting).
2. **Create course** with code, slug, fee, PDF, optional cover → publish.
3. Student: enroll → upload receipt.
4. Admin: **Verify payment** → **Approve enrollment**.
5. Student: **Continue learning** → PDF opens.

## Visual assets

Bundled **course.\*** images in `visual-assets.ts` are only fallbacks for covers when no `cover_path` is set. They are **not** course PDFs and not a course list.