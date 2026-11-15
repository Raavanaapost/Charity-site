-- =====================================================================
-- Gurushishya, change 6: approve teachers from the site.
-- The site owner (admin) sees an "Approvals" tab on their Dashboard and can
-- approve or un-approve teacher groups. Teachers still can't approve themselves.
-- =====================================================================

create table if not exists private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
insert into private.admins (user_id)
  select id from auth.users where lower(email) = 'sure.ganes@gmail.com'
  on conflict do nothing;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.admins where user_id = auth.uid())
$$;

-- Teachers still can't change "approved"; the admin can (through admin_set_approved).
create or replace function private.keep_approval() returns trigger language plpgsql set search_path = public as
$$ begin
  if new.approved is distinct from old.approved
     and coalesce(auth.role(), '') in ('authenticated', 'anon')
     and not private.is_admin() then
    new.approved := old.approved;
  end if;
  return new;
end $$;

create function public.am_i_admin() returns boolean
language sql stable security definer set search_path = public as $$ select private.is_admin() $$;

create function public.admin_groups()
returns table (id uuid, name text, slug text, art_type text, teacher_name text, owner_email text,
               approved boolean, created_at timestamptz, classes int, students int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'Only the Gurushishya admin can see this.'; end if;
  return query
    select g.id, g.name, g.slug, g.art_type, g.teacher_name, u.email::text, g.approved, g.created_at,
           (select count(*)::int from classes k where k.group_id = g.id),
           (select count(*)::int from students s join classes k on k.id = s.class_id where k.group_id = g.id)
    from groups g left join auth.users u on u.id = g.owner_id
    order by g.approved, g.created_at desc;
end $$;

create function public.admin_set_approved(group_id uuid, approve boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'Only the Gurushishya admin can do this.'; end if;
  update groups set approved = coalesce(approve, false) where id = group_id;
  if not found then raise exception 'That group was not found.'; end if;
  return coalesce(approve, false);
end $$;

revoke execute on function public.am_i_admin() from public, anon;
revoke execute on function public.admin_groups() from public, anon;
revoke execute on function public.admin_set_approved(uuid, boolean) from public, anon;
grant execute on function public.am_i_admin() to authenticated;
grant execute on function public.admin_groups() to authenticated;
grant execute on function public.admin_set_approved(uuid, boolean) to authenticated;
