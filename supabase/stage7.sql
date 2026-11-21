-- =====================================================================
-- Gurushishya, change 9: the admin can see who has signed up.
-- admin_accounts(): every account (email, joined, last sign-in, teacher groups, students).
-- admin_students(): every student (first name, class, teacher, status, account or contact email).
-- =====================================================================

create function public.admin_accounts()
returns table (email text, created_at timestamptz, last_sign_in_at timestamptz, confirmed boolean, groups int, students int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'Only the Gurushishya admin can see this.'; end if;
  return query
    select u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
           (select count(*)::int from groups g where g.owner_id = u.id),
           (select count(*)::int from students s where s.guardian_id = u.id and s.status = 'active')
    from auth.users u order by u.created_at desc;
end $$;

create function public.admin_students()
returns table (first_name text, is_adult boolean, status text, class_name text, group_name text, teacher_name text, email text, created_at timestamptz, joined_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'Only the Gurushishya admin can see this.'; end if;
  return query
    select s.first_name, s.is_adult, s.status, k.name, g.name, g.teacher_name,
           coalesce(u.email::text, s.contact_email), s.created_at, s.joined_at
    from students s join classes k on k.id = s.class_id join groups g on g.id = k.group_id
    left join auth.users u on u.id = s.guardian_id
    order by s.created_at desc;
end $$;

revoke execute on function public.admin_accounts() from public, anon;
revoke execute on function public.admin_students() from public, anon;
grant execute on function public.admin_accounts() to authenticated;
grant execute on function public.admin_students() to authenticated;
