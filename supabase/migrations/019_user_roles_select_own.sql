-- step 19 — users can read their own user_roles (is_staff RPC + client fallback)

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in ('super_admin', 'registrar', 'content_manager')
  );
$$;

grant execute on function public.is_staff() to authenticated, anon;