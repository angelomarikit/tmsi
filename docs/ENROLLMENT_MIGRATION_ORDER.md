# Enrollment & course access — SQL run order

Run in Supabase SQL Editor **after** migrations `001`–`016` (or at minimum through `014`–`015` if you already applied them):

1. `013_ebook_signed_urls.sql` (if not yet run)
2. `014_enrollment_rls.sql` (if not yet run)
3. `015_student_material_access.sql` (if not yet run)
4. **`017_enrollment_access_control.sql`** — access flag, RPCs, notifications
5. **`018_staff_enrollment_notifications.sql`** — staff in-app alert on new enrollment (optional but recommended)

Then confirm:

```sql
select proname from pg_proc
where proname in (
  'staff_verify_payment',
  'staff_approve_enrollment',
  'list_student_dashboard_enrollments'
);
```

Reply **"SQL applied"** after `017` succeeds so you can verify UI against live RPCs.

Do **not** skip `015` before `017` — `017` replaces `user_has_program_access` to require `course_access_granted`.