-- =====================================================================
-- Gurushishya, change 7: the mobile number is optional at registration.
-- (Email stays required: it's how the parent signs in.) If the parent leaves
-- it blank, any number the teacher already saved is kept.
-- =====================================================================

create or replace function public.register_student(token text, student_name text, email text, phone text, agree boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s record;
  nm text := regexp_replace(trim(coalesce(student_name, '')), '\s+', ' ', 'g');
  em text := nullif(lower(trim(coalesce(email, ''))), '');
  ph text := nullif(trim(coalesce(phone, '')), '');
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select st.* into s from students st join classes k on k.id = st.class_id join groups g on g.id = k.group_id
    where length(coalesce(token, '')) >= 24 and (st.consent_token = token or st.join_token = token) and g.approved
    for update of st;
  if not found then raise exception 'This link is not working. Please ask the teacher for a new one.'; end if;
  if s.status = 'active' then
    if s.guardian_id = auth.uid() then return s.id; end if;
    raise exception 'This link has already been used. Please ask the teacher for a new one.';
  end if;
  if s.status = 'declined' then raise exception 'This link was turned down. Please ask the teacher for a new one.'; end if;
  if not coalesce(agree, false) then raise exception 'Please tick the box to give consent.'; end if;
  if char_length(nm) < 1 or char_length(nm) > 40 then raise exception 'Please type the student''s first name.'; end if;
  if not s.is_adult and position(' ' in nm) > 0 then raise exception 'Please type the first name only.'; end if;
  if em is null or char_length(em) > 120 or em !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Please check the email address.'; end if;
  if ph is not null and ph !~ '^[+]?[0-9 ().-]{7,20}$' then raise exception 'Please check the mobile number.'; end if;
  update students set
    first_name = nm, contact_email = em, contact_phone = coalesce(ph, s.contact_phone),
    status = 'active', guardian_id = auth.uid(), joined_at = now(),
    consent_at = coalesce(consent_at, now()),
    consent_by = left(case when s.is_adult then 'Adult student (self)'
                           else coalesce(nullif(s.consent_by, ''), 'Parent ' || em) end, 80)
  where id = s.id;
  return s.id;
end $$;
