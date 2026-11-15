-- Optional: strip mistaken student role from staff-only accounts

delete from public.user_roles ur
using public.profiles p, public.roles r_student, public.roles r_staff
where ur.user_id = p.id
  and ur.role_id = r_student.id
  and r_student.slug = 'student'
  and lower(p.email) in ('admin@tmsi.com', 'staff@tmsi.com')
  and exists (
    select 1
    from public.user_roles ur2
    join public.roles rs on rs.id = ur2.role_id
    where ur2.user_id = p.id
      and rs.slug in ('super_admin', 'registrar', 'content_manager')
  );