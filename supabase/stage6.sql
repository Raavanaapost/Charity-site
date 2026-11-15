-- =====================================================================
-- Gurushishya, change 8: a teacher can withdraw a registration request.
-- Withdrawing switches the link off (it stops working) and keeps the
-- student on the list as "Withdrawn", so the teacher can send a new link
-- later or delete them. Deleting (already allowed for the class's teacher)
-- removes the student and all their practice, chat and notes.
-- =====================================================================

alter table public.students drop constraint students_status_check;
alter table public.students add constraint students_status_check
  check (status in ('waiting_consent','consented','invited','active','declined','withdrawn'));

create function public.withdraw_invite(student uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.teaches_student(student) then raise exception 'This is not your student.'; end if;
  update students set status = 'withdrawn', consent_token = null, join_token = null,
                      consent_sent_at = null, join_sent_at = null
   where id = student and status in ('waiting_consent','consented','invited');
  if not found then raise exception 'Only a request that hasn''t been accepted yet can be withdrawn.'; end if;
end $$;

-- New links: also works after a withdrawal (and starts the request again).
create or replace function public.new_invite_links(student uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.teaches_student(student) then raise exception 'This is not your student.'; end if;
  update students set
    consent_token = case when not is_adult and status in ('waiting_consent','declined','withdrawn')
                         then replace(gen_random_uuid()::text, '-', '') else consent_token end,
    join_token = replace(gen_random_uuid()::text, '-', ''),
    consent_sent_at = case when status in ('waiting_consent','declined','withdrawn') then null else consent_sent_at end,
    join_sent_at = null,
    status = case when status in ('declined','withdrawn') then (case when is_adult then 'invited' else 'waiting_consent' end)
                  when status = 'invited' and not is_adult then 'consented' else status end
  where id = student and status <> 'active';
end $$;

revoke execute on function public.withdraw_invite(uuid) from public, anon;
grant execute on function public.withdraw_invite(uuid) to authenticated;
