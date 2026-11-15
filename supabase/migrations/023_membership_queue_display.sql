-- step 23 — show username/name/email from payload when profile fields are empty

create or replace function public.admin_list_membership_applications()
returns table (
  id uuid,
  applicant_id uuid,
  reference_code text,
  status text,
  membership_access_granted boolean,
  package_code text,
  submitted_at timestamptz,
  approved_at timestamptz,
  admin_notes text,
  payload jsonb,
  email text,
  full_name text,
  username text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ma.id,
    ma.applicant_id,
    ma.reference_code,
    ma.status::text,
    ma.membership_access_granted,
    ma.package_code,
    ma.submitted_at,
    ma.approved_at,
    ma.admin_notes,
    ma.payload,
    coalesce(nullif(trim(p.email), ''), nullif(trim(ma.payload->>'email'), '')) as email,
    coalesce(nullif(trim(p.full_name), ''), nullif(trim(ma.payload->>'fullName'), '')) as full_name,
    coalesce(nullif(trim(p.username), ''), nullif(trim(ma.payload->>'username'), '')) as username
  from public.membership_applications ma
  left join public.profiles p on p.id = ma.applicant_id
  where public.is_staff()
  order by ma.submitted_at desc nulls last, ma.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_membership_applications() to authenticated;