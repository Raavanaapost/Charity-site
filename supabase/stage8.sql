-- =====================================================================
-- Gurushishya, change 10: practice buddies for adult students.
-- A student aged 18 or over can invite other adult students of the same
-- school. Buddies see each other's first name and practice numbers for
-- the last 7 days, nothing else. Children can never invite or be invited.
-- Nobody reads the table directly; everything goes through the functions.
-- =====================================================================

create table public.buddies (
  id uuid primary key default gen_random_uuid(),
  from_student uuid not null references public.students(id) on delete cascade,
  to_student uuid references public.students(id) on delete cascade,
  token text unique,
  status text not null default 'pending' check (status in ('pending','active')),
  created_at timestamptz not null default now()
);
create index buddies_from_idx on public.buddies(from_student);
create index buddies_to_idx on public.buddies(to_student);
alter table public.buddies enable row level security;   -- no policies on purpose

create function private.my_adult(student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from students where id = student and guardian_id = auth.uid() and is_adult and status = 'active')
$$;

-- One invite link per student. It can be shared with several people and works for 14 days.
create function public.buddy_invite(student uuid) returns text
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if not private.my_adult(student) then raise exception 'Practice buddies are for students aged 18 or over.'; end if;
  delete from buddies where from_student = student and status = 'pending' and created_at < now() - interval '14 days';
  select token into t from buddies where from_student = student and status = 'pending' limit 1;
  if t is null then
    t := replace(gen_random_uuid()::text, '-', '');
    insert into buddies (from_student, token) values (student, t);
  end if;
  return t;
end $$;

create function public.buddy_info(token text)
returns table (first_name text, class_name text, group_name text)
language sql stable security definer set search_path = public as $$
  select s.first_name, k.name, g.name
  from buddies b join students s on s.id = b.from_student join classes k on k.id = s.class_id join groups g on g.id = k.group_id
  where auth.uid() is not null and length(coalesce(buddy_info.token, '')) >= 24 and b.token = buddy_info.token
    and b.status = 'pending' and b.created_at > now() - interval '14 days' and s.is_adult and s.status = 'active'
$$;

create function public.buddy_accept(token text, student uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv record; mine record; bid uuid;
begin
  if not private.my_adult(student) then raise exception 'Practice buddies are for students aged 18 or over.'; end if;
  select b.from_student, s.guardian_id, k.group_id into inv
    from buddies b join students s on s.id = b.from_student join classes k on k.id = s.class_id
    where length(coalesce(buddy_accept.token, '')) >= 24 and b.token = buddy_accept.token and b.status = 'pending'
      and b.created_at > now() - interval '14 days' and s.is_adult and s.status = 'active';
  if not found then raise exception 'This invite is not working any more. Please ask for a new one.'; end if;
  if inv.guardian_id = auth.uid() then raise exception 'This is your own invite. Send it to another student.'; end if;
  select k.group_id into mine from students s join classes k on k.id = s.class_id where s.id = student;
  if mine.group_id <> inv.group_id then raise exception 'Practice buddies need to be in the same school.'; end if;
  select id into bid from buddies where status = 'active'
    and ((from_student = inv.from_student and to_student = student) or (from_student = student and to_student = inv.from_student));
  if bid is not null then return bid; end if;
  if (select count(*) from buddies where status = 'active' and (from_student in (student, inv.from_student) or to_student in (student, inv.from_student))) >= 40 then
    raise exception 'That is a lot of buddies already. Please remove one first.'; end if;
  insert into buddies (from_student, to_student, status) values (inv.from_student, student, 'active') returning id into bid;
  return bid;
end $$;

-- Me and my buddies: practice in the last 7 days (today included).
create function public.buddy_list(student uuid, today date)
returns table (id uuid, me boolean, first_name text, days int, minutes int, done_today boolean)
language plpgsql stable security definer set search_path = public as $$
declare d date := case when today between current_date - 1 and current_date + 1 then today else current_date end;
begin
  if not private.my_adult(student) then return; end if;
  return query
    with who as (
      select null::uuid as bid, student as sid, true as is_me
      union all
      select b.id, case when b.from_student = student then b.to_student else b.from_student end, false
        from buddies b where b.status = 'active' and (b.from_student = student or b.to_student = student)
    )
    select w.bid, w.is_me, s.first_name,
      (select count(distinct l.day)::int from practice_logs l where l.student_id = w.sid and l.day > d - 7 and l.day <= d),
      (select coalesce(sum(l.minutes), 0)::int from practice_logs l where l.student_id = w.sid and l.day > d - 7 and l.day <= d),
      exists (select 1 from practice_logs l where l.student_id = w.sid and l.day = d)
    from who w join students s on s.id = w.sid
    where w.is_me or (s.is_adult and s.status = 'active')
    order by w.is_me desc, 4 desc, 5 desc, s.first_name;
end $$;

create function public.buddy_remove(buddy uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from buddies b where b.id = buddy and b.status = 'active'
    and exists (select 1 from students s where s.id in (b.from_student, b.to_student) and s.guardian_id = auth.uid());
  if not found then raise exception 'That buddy was not found.'; end if;
end $$;

revoke all on table public.buddies from anon, authenticated;
revoke execute on function public.buddy_invite(uuid), public.buddy_info(text), public.buddy_accept(text, uuid), public.buddy_list(uuid, date), public.buddy_remove(uuid) from public, anon;
grant execute on function public.buddy_invite(uuid), public.buddy_info(text), public.buddy_accept(text, uuid), public.buddy_list(uuid, date), public.buddy_remove(uuid) to authenticated;
