-- =====================================================================
-- Riyaz, change 4: teacher-managed student list, parent consent, join
-- invitations, start/stop practice sessions, teacher-student chat,
-- class board (announcements, class notes, homework), private teacher notes.
-- Students can no longer join a class by themselves.
-- =====================================================================

-- 1. No more self-joining with a class link
drop function if exists public.join_class(text, text, boolean, boolean);
drop function if exists public.class_by_code(text);

-- 2. Teachers must agree to the code of conduct when they create a group
alter table public.groups add column if not exists agreed_at timestamptz;
update public.groups set agreed_at = coalesce(agreed_at, created_at);
drop policy "teacher creates own group" on public.groups;
create policy "teacher creates own group" on public.groups for insert
  with check (owner_id = auth.uid() and approved = false and agreed_at is not null);

-- 3. Students: added by the teacher -> parent consents -> student joins
alter table public.students alter column guardian_id drop not null;
alter table public.students alter column consent_at drop not null;
alter table public.students
  add column status text not null default 'active'
    check (status in ('waiting_consent','consented','invited','active','declined')),
  add column contact_name text check (char_length(contact_name) <= 80),
  add column contact_email text check (contact_email is null or (char_length(contact_email) <= 120 and contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')),
  add column contact_phone text check (contact_phone is null or contact_phone ~ '^[+]?[0-9 ().-]{7,20}$'),
  add column consent_token text unique,
  add column join_token text unique,
  add column consent_sent_at timestamptz,
  add column consent_by text check (char_length(consent_by) <= 80),
  add column join_sent_at timestamptz,
  add column joined_at timestamptz,
  add column board_seen_at timestamptz;
alter table public.students add constraint students_child_needs_contact
  check (is_adult or status = 'active' or contact_email is not null or contact_phone is not null);

-- Only Riyaz's own consent and join steps may set the consent, status and link fields.
-- (Those steps run as the database owner; direct edits from the website run as "authenticated".)
create function private.students_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.guardian_id := null; new.joined_at := null; new.consent_at := null; new.consent_by := null;
      new.consent_sent_at := null; new.join_sent_at := null; new.board_seen_at := null;
      new.status := case when new.is_adult then 'invited' else 'waiting_consent' end;
      new.consent_token := case when new.is_adult then null else replace(gen_random_uuid()::text, '-', '') end;
      new.join_token := replace(gen_random_uuid()::text, '-', '');
    else
      new.guardian_id := old.guardian_id; new.status := old.status; new.is_adult := old.is_adult;
      new.consent_at := old.consent_at; new.consent_by := old.consent_by; new.consent_token := old.consent_token;
      new.join_token := old.join_token; new.consent_sent_at := old.consent_sent_at; new.join_sent_at := old.join_sent_at;
      new.joined_at := old.joined_at; new.created_at := old.created_at; new.board_seen_at := old.board_seen_at;
    end if;
  end if;
  return new;
end $$;
create trigger students_guard before insert or update on public.students
  for each row execute function private.students_guard();

drop policy if exists "family renames student" on public.students;
create policy "teacher adds students" on public.students for insert with check (private.owns_class(class_id));
create policy "teacher edits students" on public.students for update
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));

-- Teacher: record that a consent request or join link was sent
create function public.mark_invite_sent(student uuid, which text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.teaches_student(student) then raise exception 'This is not your student.'; end if;
  if which = 'consent' then
    update students set consent_sent_at = now() where id = student and status = 'waiting_consent';
  elsif which = 'join' then
    update students set join_sent_at = now(), status = case when status = 'consented' then 'invited' else status end
      where id = student and status in ('consented', 'invited');
  end if;
end $$;

-- Teacher: make fresh links (lost link, or asking again after a "no")
create function public.new_invite_links(student uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.teaches_student(student) then raise exception 'This is not your student.'; end if;
  update students set
    consent_token = case when not is_adult and status in ('waiting_consent','declined') then replace(gen_random_uuid()::text, '-', '') else consent_token end,
    join_token = replace(gen_random_uuid()::text, '-', ''),
    consent_sent_at = case when status in ('waiting_consent','declined') then null else consent_sent_at end,
    join_sent_at = null,
    status = case when status = 'declined' then 'waiting_consent' when status = 'invited' and not is_adult then 'consented' else status end
  where id = student and status <> 'active';
end $$;

-- Anyone with a link: what is this invitation? (first name and class only)
create function public.invite_info(token text)
returns table (step text, status text, first_name text, is_adult boolean, class_name text,
               group_name text, teacher_name text, day_of_week smallint, start_time time, mine boolean)
language sql stable security definer set search_path = public as $$
  select case when s.consent_token = token then 'consent' else 'join' end, s.status, s.first_name, s.is_adult,
         k.name, g.name, g.teacher_name, k.day_of_week, k.start_time, coalesce(s.guardian_id = auth.uid(), false)
  from students s join classes k on k.id = s.class_id join groups g on g.id = k.group_id
  where length(coalesce(token, '')) >= 24 and g.approved and (s.consent_token = token or s.join_token = token)
  limit 1
$$;

-- Parent: answer the consent request (no account needed)
create function public.answer_consent(token text, parent_name text, agree boolean) returns text
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  select st.* into s from students st join classes k on k.id = st.class_id join groups g on g.id = k.group_id
    where length(coalesce(token, '')) >= 24 and st.consent_token = token and g.approved for update of st;
  if not found then raise exception 'This link is not working. Please ask the teacher for a new one.'; end if;
  if s.status <> 'waiting_consent' then return s.status; end if;
  if coalesce(agree, false) then
    if char_length(trim(coalesce(parent_name, ''))) < 2 then raise exception 'Please type your name.'; end if;
    update students set status = 'consented', consent_at = now(), consent_by = left(trim(parent_name), 80) where id = s.id;
    return 'consented';
  end if;
  update students set status = 'declined' where id = s.id;
  return 'declined';
end $$;

-- Student or parent: accept the join invitation (must be signed in)
create function public.accept_invite(token text, agree boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select st.* into s from students st join classes k on k.id = st.class_id join groups g on g.id = k.group_id
    where length(coalesce(token, '')) >= 24 and st.join_token = token and g.approved for update of st;
  if not found then raise exception 'This link is not working. Please ask the teacher for a new one.'; end if;
  if s.status = 'active' then
    if s.guardian_id = auth.uid() then return s.id; end if;
    raise exception 'This invitation has already been used. Please ask the teacher for a new one.';
  end if;
  if s.status not in ('consented', 'invited') then
    raise exception 'A parent needs to give consent first. The teacher will send this link after that.';
  end if;
  if s.is_adult and not coalesce(agree, false) then raise exception 'Please tick the box to agree.'; end if;
  update students set status = 'active', guardian_id = auth.uid(), joined_at = now(),
    consent_at = coalesce(consent_at, now()), consent_by = coalesce(consent_by, 'Adult student (self)')
  where id = s.id;
  return s.id;
end $$;

-- 4. Practice: Start / Stop sessions add up into the day's total
alter table public.practice_logs add column sessions smallint not null default 1;
create function public.add_practice(student uuid, mins int, on_day date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.my_student(student) then raise exception 'This is not your student.'; end if;
  if mins is null or mins < 0 or mins > 300 then raise exception 'Practice time must be between 0 and 300 minutes.'; end if;
  if on_day is null or on_day > current_date + 1 or on_day < current_date - 8 then raise exception 'Please choose a day in the last week.'; end if;
  insert into practice_logs (student_id, day, minutes, sessions) values (student, on_day, nullif(mins, 0), 1)
  on conflict (student_id, day) do update
    set minutes = nullif(coalesce(practice_logs.minutes, 0) + coalesce(excluded.minutes, 0), 0),
        sessions = practice_logs.sessions + 1;
end $$;

-- 5. Chat (teacher <-> one student's family) and the class board (teacher posts to a class)
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  class_id uuid references public.classes on delete cascade,
  student_id uuid references public.students on delete cascade,
  kind text not null default 'chat' check (kind in ('chat', 'post', 'class_note', 'homework')),
  from_teacher boolean not null,
  sender_id uuid references auth.users on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'chat' and student_id is not null and class_id is null)
      or (kind <> 'chat' and class_id is not null and student_id is null and from_teacher))
);
create index chat_by_student on public.chat_messages (student_id, created_at);
create index chat_by_class on public.chat_messages (class_id, created_at);
alter table public.chat_messages enable row level security;
create policy "teacher, family or class can read" on public.chat_messages for select using (
  private.owns_group(group_id)
  or (student_id is not null and private.my_student(student_id))
  or (student_id is null and class_id is not null and private.in_class(class_id)));
create policy "teacher deletes" on public.chat_messages for delete using (private.owns_group(group_id));
-- No direct inserts or edits: everything goes through the functions below

create function public.send_chat(student uuid, body text, as_teacher boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid; m uuid;
begin
  if as_teacher and not private.teaches_student(student) then raise exception 'This is not your student.'; end if;
  if not as_teacher and not private.my_student(student) then raise exception 'You can only message your own teacher.'; end if;
  if char_length(trim(coalesce(body, ''))) = 0 then raise exception 'Please write a message.'; end if;
  select k.group_id into g from students s join classes k on k.id = s.class_id where s.id = student;
  insert into chat_messages (group_id, student_id, kind, from_teacher, sender_id, body)
    values (g, student, 'chat', as_teacher, auth.uid(), left(trim(body), 2000)) returning id into m;
  return m;
end $$;

create function public.message_students(student_ids uuid[], body text) returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; x uuid;
begin
  if char_length(trim(coalesce(body, ''))) = 0 then raise exception 'Please write a message.'; end if;
  if coalesce(array_length(student_ids, 1), 0) = 0 then raise exception 'Choose at least one student.'; end if;
  foreach x in array (select array_agg(distinct y) from unnest(student_ids) y) loop
    if not private.teaches_student(x) then raise exception 'Some of those students are not yours.'; end if;
  end loop;
  insert into chat_messages (group_id, student_id, kind, from_teacher, sender_id, body)
    select k.group_id, s.id, 'chat', true, auth.uid(), left(trim(body), 2000)
    from students s join classes k on k.id = s.class_id where s.id = any(student_ids);
  get diagnostics n = row_count;
  return n;
end $$;

create function public.post_to_class(class uuid, post_kind text, body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid; m uuid;
begin
  if not private.owns_class(class) then raise exception 'This is not your class.'; end if;
  if post_kind not in ('post', 'class_note', 'homework') then raise exception 'Unknown post type.'; end if;
  if char_length(trim(coalesce(body, ''))) = 0 then raise exception 'Please write something.'; end if;
  select group_id into g from classes where id = class;
  insert into chat_messages (group_id, class_id, kind, from_teacher, sender_id, body)
    values (g, class, post_kind, true, auth.uid(), left(trim(body), 2000)) returning id into m;
  return m;
end $$;

create function public.mark_chat_read(student uuid, as_teacher boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if as_teacher and private.teaches_student(student) then
    update chat_messages set read_at = now() where student_id = student and not from_teacher and read_at is null;
  elsif not as_teacher and private.my_student(student) then
    update chat_messages set read_at = now() where student_id = student and from_teacher and read_at is null;
    update students set board_seen_at = now() where id = student;
  end if;
end $$;

-- 6. Private notes: only the teacher sees them
create table public.teacher_notes (
  student_id uuid primary key references public.students on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  updated_at timestamptz not null default now()
);
alter table public.teacher_notes enable row level security;
create policy "teacher only" on public.teacher_notes for all
  using (private.teaches_student(student_id)) with check (private.teaches_student(student_id));

-- 7. Who may call what
revoke execute on function public.mark_invite_sent(uuid, text) from public, anon;
revoke execute on function public.new_invite_links(uuid) from public, anon;
revoke execute on function public.accept_invite(text, boolean) from public, anon;
revoke execute on function public.add_practice(uuid, int, date) from public, anon;
revoke execute on function public.send_chat(uuid, text, boolean) from public, anon;
revoke execute on function public.message_students(uuid[], text) from public, anon;
revoke execute on function public.post_to_class(uuid, text, text) from public, anon;
revoke execute on function public.mark_chat_read(uuid, boolean) from public, anon;
grant execute on function public.mark_invite_sent(uuid, text) to authenticated;
grant execute on function public.new_invite_links(uuid) to authenticated;
grant execute on function public.accept_invite(text, boolean) to authenticated;
grant execute on function public.add_practice(uuid, int, date) to authenticated;
grant execute on function public.send_chat(uuid, text, boolean) to authenticated;
grant execute on function public.message_students(uuid[], text) to authenticated;
grant execute on function public.post_to_class(uuid, text, text) to authenticated;
grant execute on function public.mark_chat_read(uuid, boolean) to authenticated;
grant execute on function public.invite_info(text) to anon, authenticated;
grant execute on function public.answer_consent(text, text, boolean) to anon, authenticated;
