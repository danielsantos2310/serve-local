-- 0002: fixes and additions after the first beta schema

-- 1. Role changes are allowed only through apply_as_provider (or by an admin).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_setting('app.allow_role_change', true) is distinct from 'on'
     and public.current_role_name() is distinct from 'admin' then
    raise exception 'role change not allowed';
  end if;
  if new.free_until is distinct from old.free_until
     and public.current_role_name() is distinct from 'admin' then
    raise exception 'free period cannot be changed';
  end if;
  return new;
end $$;

-- 2. Providers apply through one function, so role, profile and services change together.
drop policy if exists provider_insert_own on public.provider_profiles;

create or replace function public.apply_as_provider(
  p_bio text,
  p_years int,
  p_postcode text,
  p_services jsonb   -- e.g. [{"code":"clean_standard","rate_pence":2000}]
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_provider_id uuid;
  v_item jsonb;
begin
  if v_uid is null then
    raise exception 'sign in first';
  end if;
  if exists (select 1 from public.provider_profiles where profile_id = v_uid) then
    raise exception 'you have already applied';
  end if;
  if jsonb_array_length(coalesce(p_services, '[]'::jsonb)) = 0 then
    raise exception 'choose at least one service';
  end if;

  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles
     set role = 'provider',
         postcode = coalesce(nullif(p_postcode, ''), postcode)
   where id = v_uid;

  insert into public.provider_profiles (profile_id, bio, years_experience)
  values (v_uid, nullif(p_bio, ''), p_years)
  returning id into v_provider_id;

  for v_item in select * from jsonb_array_elements(p_services) loop
    insert into public.provider_services (provider_id, service_id, rate_pence)
    select v_provider_id, s.id, (v_item->>'rate_pence')::int
      from public.services s
     where s.code = v_item->>'code' and s.active;
  end loop;

  if not exists (select 1 from public.provider_services where provider_id = v_provider_id) then
    raise exception 'none of the chosen services are available';
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values (v_uid::text, 'provider_applied', 'provider_profile', v_provider_id);

  return v_provider_id;
end $$;

grant execute on function public.apply_as_provider(text, int, text, jsonb) to authenticated;

-- 3. Bookings only with verified providers, for a service they actually offer.
create or replace function public.prepare_booking()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_rate integer;
  v_status provider_status;
begin
  if new.starts_at <= now() then
    raise exception 'booking must be in the future';
  end if;

  select pp.status into v_status from public.provider_profiles pp where pp.id = new.provider_id;
  if v_status is distinct from 'verified' then
    raise exception 'this provider is not available for bookings';
  end if;

  select rate_pence into v_rate
    from public.provider_services
   where provider_id = new.provider_id and service_id = new.service_id;
  if v_rate is null then
    raise exception 'this provider does not offer that service';
  end if;

  new.agreed_price_pence := round(v_rate * new.hours);
  new.status := 'requested';
  return new;
end $$;

-- 4. Feedback from beta users (signed-in users only; admins read it).
create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('bug', 'idea', 'praise', 'other')),
  message     text not null check (char_length(message) between 5 and 2000),
  page        text check (char_length(page) <= 200),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;
create policy feedback_insert_own on public.feedback for insert
  with check (user_id = auth.uid());
create policy feedback_admin_read on public.feedback for select
  using (public.current_role_name() = 'admin');

-- 5. Rating summary per provider (public, aggregate only).
create view public.provider_rating_summary as
select
  b.provider_id,
  round(avg(r.rating)::numeric, 2) as avg_rating,
  count(*)::int                    as review_count
from public.reviews r
join public.bookings b on b.id = r.booking_id
group by b.provider_id;

grant select on public.provider_rating_summary to anon, authenticated;
