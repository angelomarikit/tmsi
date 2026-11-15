# TMVS membership — test checklist

Run after migrations **021**–**026** in Supabase.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Guest submits membership form with email/password + payment ref/date/receipt | Auth user + `membership_applications` + `payment_submissions` (`tmvs_membership`) |
| 2 | Logged-in user applies via dashboard **Apply for TMVS membership** modal | Same as (1); email locked to session; no LEAP enrollment required |
| 3 | Privacy modal without checkbox | Cannot submit |
| 4 | Before staff approve | `/dashboard/downloads` locked |
| 5 | Staff `/admin/membership-approvals` — view receipt, **Approve** or **Decline** | Approve marks payment verified + `tmvs_member` role; Decline → `rejected` |
| 6 | Member after approve | `/dashboard/downloads` lists staff-uploaded files |
| 7 | **Course-only** account (LEAP enrollments, no TMVS) | Sign-in → `/dashboard`; My Courses works; Downloads shows apply option only |
| 8 | **Both** tracks | My Courses + Member Downloads independently; neither blocks the other |
| 9 | Pending member without receipt | Optional TMVS banner + upload on Downloads; LEAP enrollments unaffected |