-- Abhyasa database (Stage 1)
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste all > Run.
-- Privacy rules are enforced here (row level security), not just on screens.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  name text not null check (char_length(name) between 2 and 80),
  art_type text not null check (art_type in ('dance','flute','violin','piano','veena','mridangam','vocal','yoga','art','other')),
  teacher_name text not null check (char_length(teacher_name) <= 80),
  bio text check (char_length(bio) <= 1500),
  location text check (char_length(location) <= 120),
  is_online boolean not null default false,
  approved boolean not null default false,   -- set to true by the Abhyasa admin after checking the teacher
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  start_time time not null,
  duration_min smallint not null default 60 check (duration_min between 10 and 300),
  join_code text not null unique default lower(substr(encode(gen_random_bytes(6),'hex'),1,8)),
  created_at timestamptz not null default now()
);

-- Kept apart from classes so the public timetable never shows the Zoom/Meet link
create table public.class_links (
  class_id uuid primary key references public.classes on delete cascade,
  meeting_url text check (meeting_url ~ '^https://')
);

-- Children: first name only. No date of birth, school or address.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes on delete cascade,
  guardian_id uuid not null references auth.users on delete cascade,  -- the parent, or the adult learner
  first_name text not null check (char_length(first_name) between 1 and 40),
  is_adult boolean not null default false,
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.practice_tasks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes on delete cascade,
  week_start date not null,
  title text not null check (char_length(title) <= 200),
  minutes smallint not null default 10 check (minutes between 1 and 180),
  demo_url text check (demo_url is null or demo_url ~ '^https://'),
  created_at timestamptz not null default now(),
  unique (class_id, week_start)
);

create table public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  day date not null,
  minutes smallint,
  created_at timestamptz not null default now(),
  unique (student_id, day)
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null check (char_length(name) <= 80),
  contact text not null check (char_length(contact) <= 120),
  message text check (char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

-- ---------- Helper checks ----------

create function public.owns_group(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from groups where id = g and owner_id = auth.uid()) $$;

create function public.owns_class(c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from classes k join groups g on g.id = k.group_id where k.id = c and g.owner_id = auth.uid()) $$;

create function public.in_class(c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from students where class_id = c and guardian_id = auth.uid()) $$;

create function public.my_student(s uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from students where id = s and guardian_id = auth.uid()) $$;

create function public.teaches_student(s uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from students st where st.id = s and public.owns_class(st.class_id)) $$;

-- ---------- Row level security ----------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table classes enable row level security;
alter table class_links enable row level security;
alter table students enable row level security;
alter table practice_tasks enable row level security;
alter table practice_logs enable row level security;
alter table enquiries enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "public sees approved groups" on groups for select using (approved or owner_id = auth.uid());
create policy "teacher creates own group" on groups for insert with check (owner_id = auth.uid() and approved = false);
create policy "teacher edits own group" on groups for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Only the Abhyasa admin (in the Supabase dashboard) can approve a group
create function public.keep_approval() returns trigger language plpgsql as
$$ begin
  if new.approved is distinct from old.approved and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.approved := old.approved;
  end if;
  return new;
end $$;
create trigger groups_keep_approval before update on groups for each row execute function public.keep_approval();
create policy "teacher deletes own group" on groups for delete using (owner_id = auth.uid());

create policy "public sees timetable of approved groups" on classes for select
  using (exists (select 1 from groups g where g.id = group_id and (g.approved or g.owner_id = auth.uid())) or in_class(id));
create policy "teacher manages classes" on classes for all using (owns_group(group_id)) with check (owns_group(group_id));

create policy "teacher and class families see link" on class_links for select using (owns_class(class_id) or in_class(class_id));
create policy "teacher manages link" on class_links for all using (owns_class(class_id)) with check (owns_class(class_id));

create policy "family and teacher see student" on students for select using (guardian_id = auth.uid() or owns_class(class_id));
create policy "family removes student" on students for delete using (guardian_id = auth.uid() or owns_class(class_id));
create policy "family renames student" on students for update using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());
-- New students are added only through join_class() below.

create policy "class sees practice" on practice_tasks for select using (owns_class(class_id) or in_class(class_id));
create policy "teacher sets practice" on practice_tasks for all using (owns_class(class_id)) with check (owns_class(class_id));

create policy "family and teacher see ticks" on practice_logs for select using (my_student(student_id) or teaches_student(student_id));
create policy "family ticks" on practice_logs for insert with check (my_student(student_id));
create policy "family unticks" on practice_logs for delete using (my_student(student_id));

create policy "anyone sends enquiry" on enquiries for insert with check (exists (select 1 from groups g where g.id = group_id and g.approved));
create policy "teacher reads enquiries" on enquiries for select using (owns_group(group_id));
create policy "teacher deletes enquiries" on enquiries for delete using (owns_group(group_id));

-- ---------- Joining a class by link ----------

-- What a family sees before joining (no student names, no meeting link)
create function public.class_by_code(code text)
returns table (class_id uuid, class_name text, group_name text, teacher_name text, day_of_week smallint, start_time time)
language sql stable security definer set search_path = public as
$$ select k.id, k.name, g.name, g.teacher_name, k.day_of_week, k.start_time
   from classes k join groups g on g.id = k.group_id
   where k.join_code = lower(code) and g.approved $$;

create function public.join_class(code text, first_name text, adult boolean, consent boolean)
returns uuid language plpgsql security definer set search_path = public as
$$
declare c uuid; s uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if not consent then raise exception 'Consent is needed to join'; end if;
  select k.id into c from classes k join groups g on g.id = k.group_id where k.join_code = lower(code) and g.approved;
  if c is null then raise exception 'This class link is not valid'; end if;
  insert into students (class_id, guardian_id, first_name, is_adult, consent_at)
    values (c, auth.uid(), trim(first_name), adult, now()) returning id into s;
  return s;
end $$;

grant execute on function public.class_by_code(text) to anon, authenticated;
grant execute on function public.join_class(text, text, boolean, boolean) to authenticated;
