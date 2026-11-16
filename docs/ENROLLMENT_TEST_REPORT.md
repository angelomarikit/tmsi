# Enrollment workflow — test report

**Database:** migrations **013–018**, **026**, and **031** (enrollment dashboard RPC + course path reset) applied where noted below.

**Code ↔ DB:** RPCs `list_student_dashboard_enrollments`, `staff_verify_payment`, `staff_approve_enrollment`, `user_has_program_access`, and trigger `enrollment_notify_staff` are wired in the React app.

## Quick SQL sanity (optional)

```sql
-- Replace with a real student user id after a test enrollment
select public.user_has_program_access(
  'STUDENT_UUID'::uuid,
  'PROGRAM_UUID'::uuid
);
```

## Scenario checklist

| # | Scenario | Expected | Verified |
|---|----------|----------|----------|
| 1 | Guest clicks **Enroll Now** | `/register?next=/enroll?program=…` or login → `/dashboard` | ☐ Manual |
| 2 | Student submits enrollment + receipt (public `/enroll` or dashboard **Purchase a LEAP course** modal with QR) | `enrollment_applications`, `payment_submissions`, storage object | ☐ Manual |
| 2b | Sign-in default destination | Non-staff → `/dashboard` (not homepage) | ☐ Manual |
| 2c | **Membership-only** user purchases course from dashboard hub | Works without TMVS membership | ☐ Manual |
| 3 | Student dashboard pending card | **Pending Admin Approval**, disabled Read/Download | ☐ Manual |
| 4 | Student cannot use enabled material buttons while pending | Only disabled controls | ☐ Manual |
| 5 | Direct `/dashboard/courses/:programId` while pending | Blocked (UI + `user_has_program_access` false) | ☐ Manual |
| 6 | Direct storage / raw `content_items` without access | RLS denies; signed URL only after access | ☐ Manual |
| 7 | Admin `/admin/enrollment-approvals` | Row + stats; staff notification from **018** | ☐ Manual |
| 8 | Admin **Verify payment** only | `payment_submissions.status = verified`, `course_access_granted` still false | ☐ Manual |
| 9 | Admin **Approve** without verified payment | RPC error: payment must be verified | ☐ Manual |
| 10 | Admin **Approve** after verify | `status = approved`, `course_access_granted = true`, audit log | ☐ Manual |
| 11 | Student dashboard after approve | **Enrolled — Access Granted**, **Continue Learning** | ☐ Manual |
| 12 | Course reader + PDF download | Materials from `content_items`; signed URLs | ☐ Manual |
| 13 | Reject / correction flows | Locked; `in_app_notifications` for student | ☐ Manual |
| 14 | Cross-student isolation | Student A cannot read B enrollments or materials | ☐ Manual |
| 15 | Duplicate active application | Second submit blocked for same user/course | ☐ Manual |
| 16 | Admin audit trail | `audit_logs` rows for verify / approve / reject | ☐ Manual |

## Suggested manual pass (≈15 min)

1. **Student account:** register → enroll one LEAP program → upload receipt → confirm `/dashboard` pending state.
2. **Staff account** (`super_admin`, `registrar`, or `content_manager` role): open **Enrollment Approvals** → **View Application** → **Verify Payment** → **Approve Enrollment**.
3. **Student again:** refresh `/dashboard` → **Continue Learning** → open a published `content_items` PDF if admin uploaded one.
4. **Negative:** as pending student, open reader URL in a new tab; try Storage URL without sign-in.

## Owner end-to-end script (LEAP + TMVS)

### LEAP course pipeline

1. Admin → **Courses** → **Manage** → upload at least one PDF for a test program.
2. Student: **register** (if Supabase **email confirmation** is on, confirm email and **sign in** before purchasing).
3. Dashboard → **Purchase a LEAP course** → complete payment fields + receipt → card appears on **My Courses**.
4. Admin: verify payment → approve enrollment.
5. Student: **Continue Learning** → materials list matches Admin uploads; download opens signed URL.

### TMVS pipeline

1. Student (signed in): Dashboard → **Apply for TMVS membership** (or `/dashboard?apply=tmvs`) → **Submit membership application** → consent → reference on **Member downloads**.
2. Admin: membership approvals → verify payment → approve.
3. Admin: upload member files to `membership-materials/` as needed.
4. Student: **Member downloads** shows files after approval.

### Negative cases

| Case | Expected |
|------|----------|
| Approved enrollment, **zero** admin uploads | Reader shows “No learning materials are available for this course yet.” |
| Register without confirmed email (confirm ON) | Redirect to login with `next=`; no purchase until signed in |
| Dashboard enrollment RPC missing (**026**) | Red error on My Courses with migration hint |

## Configuration notes

| Item | Status |
|------|--------|
| Supabase Auth email verification | If **enabled**, students must confirm email then sign in before enrollments list and purchase modal work |
| Outbound email for notifications | Not required; in-app only unless SMTP configured |
| Course PDFs for reader | Admin **Manage** materials only (`content_items`); migration **031** clears legacy path placeholders |
| Staff roles | `user_roles` must include registrar/admin for approvals |
| `Metrobank` payment copy | Institution settings / enroll form (not Apex dev accounts) |

## Known UI gaps (non-blocking)

- Sidebar placeholders: Certificates, Downloads, Messages (not fully built).
- No fake progress percentages on course cards.
- Module reorder UI uses `content_items` list, not a separate `course_modules` table.