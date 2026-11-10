-- Serve Local — public beta schema (free, no payments)
-- Free-period settings live in beta_config. Change them there, not in code.

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
create type user_role as enum ('customer', 'provider', 'admin');
create type provider_status as enum ('applied', 'verified', 'suspended', 'rejected');
create type booking_status as enum (
  'requested', 'declined', 'accepted', 'completed',
  'cancelled_by_customer', 'cancelled_by_provider'
);

-- ---------------------------------------------------------------
-- Beta configuration (single row)
-- ---------------------------------------------------------------
create table public.beta_config (
  id                     int primary key default 1 check (id = 1),
  customer_free_months   int not null default 3 check (customer_free_months >= 0),
  provider_free_months   int not null default 5 check (provider_free_months >= 0),
  launched_at            timestamptz not null default now()
);
insert into public.beta_config (id) values (1);

-- ---------------------------------------------------------------
-- Helper: current user's role (used by RLS)
-- ---------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'customer',
  full_name   text not null check (char_length(full_name) between 1 and 100),
  postcode    text check (char_length(postcode) <= 10),
  free_until  timestamptz,
  created_at  timestamptz not null default now()
);

create or replace function public.current_role_name()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- New sign-up gets a profile automatically and a customer free period
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, free_until)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'New user'),
    'customer',
    now() + make_interval(months => (select customer_free_months from public.beta_config where id = 1))
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users cannot change their own role
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.current_role_name() is distinct from 'admin' then
    raise exception 'role change not allowed';
  end if;
  if new.free_until is distinct from old.free_until and public.current_role_name() is distinct from 'admin' then
    raise exception 'free period cannot be changed';
  end if;
  return new;
end $$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------
-- Services (allow-list; regulated work is NOT listed)
-- ---------------------------------------------------------------
create table public.services (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  label          text not null,
  min_rate_pence integer not null check (min_rate_pence >= 0),
  active         boolean not null default true
);

insert into public.services (code, label, min_rate_pence) values
  ('clean_standard', 'Standard home clean', 1500),
  ('clean_deep',     'Deep clean',          2000);

-- ---------------------------------------------------------------
-- Provider profiles
-- ---------------------------------------------------------------
create table public.provider_profiles (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid unique not null references public.profiles (id) on delete cascade,
  status            provider_status not null default 'applied',
  bio               text check (char_length(bio) <= 1000),
  years_experience  int check (years_experience >= 0 and years_experience <= 80),
  free_until        timestamptz,
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);

create or replace function public.set_provider_free_until()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.free_until := now() + make_interval(months => (select provider_free_months from public.beta_config where id = 1));
  return new;
end $$;

create trigger provider_free_until
  before insert on public.provider_profiles
  for each row execute function public.set_provider_free_until();

-- Only admins can change status (applied -> verified, suspended, etc.)
create or replace function public.guard_provider_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if public.current_role_name() is distinct from 'admin' then
      raise exception 'only an admin can change provider status';
    end if;
    if new.status = 'verified' then
      new.verified_at := now();
    end if;
  end if;
  if new.free_until is distinct from old.free_until and public.current_role_name() is distinct from 'admin' then
    raise exception 'free period cannot be changed';
  end if;
  return new;
end $$;

create trigger provider_status_guard
  before update on public.provider_profiles
  for each row execute function public.guard_provider_status();

create table public.provider_services (
  provider_id uuid not null references public.provider_profiles (id) on delete cascade,
  service_id  uuid not null references public.services (id),
  rate_pence  integer not null check (rate_pence > 0),
  primary key (provider_id, service_id)
);

create or replace function public.check_rate_minimum()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_min integer;
begin
  select min_rate_pence into v_min from public.services where id = new.service_id;
  if new.rate_pence < v_min then
    raise exception 'rate below the platform minimum of % pence', v_min;
  end if;
  return new;
end $$;

create trigger provider_services_rate_min
  before insert or update on public.provider_services
  for each row execute function public.check_rate_minimum();

create table public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles (id) on delete cascade,
  weekday     int not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

-- ---------------------------------------------------------------
-- Bookings (requests only in beta; no money moves through the site)
-- ---------------------------------------------------------------
create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.profiles (id),
  provider_id           uuid not null references public.provider_profiles (id),
  service_id            uuid not null references public.services (id),
  status                booking_status not null default 'requested',
  starts_at             timestamptz not null,
  hours                 numeric(4,1) not null check (hours > 0 and hours <= 12),
  agreed_price_pence    integer not null default 0 check (agreed_price_pence >= 0),
  notes                 text check (char_length(notes) <= 500),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index bookings_customer_idx on public.bookings (customer_id);
create index bookings_provider_idx on public.bookings (provider_id, status);

-- Price is computed on the server from the provider's own rate; the client cannot set it.
create or replace function public.prepare_booking()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_rate integer;
begin
  if new.starts_at <= now() then
    raise exception 'booking must be in the future';
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

create trigger bookings_prepare
  before insert on public.bookings
  for each row execute function public.prepare_booking();

-- Status transitions allowed per actor
create or replace function public.booking_guard()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_provider_user uuid;
  v_role user_role := public.current_role_name();
begin
  if new.status = old.status
     and new.customer_id = old.customer_id
     and new.provider_id = old.provider_id
     and new.service_id = old.service_id
     and new.starts_at = old.starts_at
     and new.hours = old.hours
     and new.agreed_price_pence = old.agreed_price_pence then
    return new;
  end if;

  select profile_id into v_provider_user from public.provider_profiles where id = old.provider_id;

  if v_role = 'admin' then
    null;
  elsif auth.uid() = old.customer_id
        and old.status in ('requested', 'accepted')
        and new.status = 'cancelled_by_customer' then
    null;
  elsif auth.uid() = v_provider_user and (
        (old.status = 'requested' and new.status in ('accepted', 'declined'))
     or (old.status = 'accepted' and new.status in ('completed', 'cancelled_by_provider'))
  ) then
    null;
  else
    raise exception 'that status change is not allowed for you';
  end if;

  -- Only status may change for non-admins
  if v_role is distinct from 'admin' and (
       new.customer_id is distinct from old.customer_id
    or new.provider_id is distinct from old.provider_id
    or new.service_id is distinct from old.service_id
    or new.starts_at is distinct from old.starts_at
    or new.hours is distinct from old.hours
    or new.agreed_price_pence is distinct from old.agreed_price_pence) then
    raise exception 'only the status can be changed';
  end if;

  new.updated_at := now();
  return new;
end $$;

create trigger bookings_guard
  before update on public.bookings
  for each row execute function public.booking_guard();

-- Audit trail: every status change is recorded
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   text,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;

create trigger audit_log_no_change
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

create or replace function public.audit_booking_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (actor_id, action, entity, entity_id, detail)
    values (auth.uid()::text, 'booking_status_change', 'booking', new.id,
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;

create trigger bookings_audit
  after update on public.bookings
  for each row execute function public.audit_booking_status();

-- ---------------------------------------------------------------
-- Reviews: only the customer of a completed booking, once per booking
-- ---------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid unique not null references public.bookings (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text check (char_length(body) <= 1000),
  created_at  timestamptz not null default now()
);

create or replace function public.review_allowed()
returns trigger language plpgsql security definer set search_path = public
as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = new.booking_id;
  if b.status <> 'completed' then
    raise exception 'reviews are only allowed for completed bookings';
  end if;
  return new;
end $$;

create trigger reviews_completed_only
  before insert on public.reviews
  for each row execute function public.review_allowed();

-- ---------------------------------------------------------------
-- Public view: verified providers only, first name and outward postcode only
-- ---------------------------------------------------------------
create view public.public_providers as
select
  pp.id                                   as provider_id,
  split_part(p.full_name, ' ', 1)         as first_name,
  split_part(coalesce(p.postcode, ''), ' ', 1) as postcode_area,
  pp.bio,
  pp.years_experience
from public.provider_profiles pp
join public.profiles p on p.id = pp.profile_id
where pp.status = 'verified';

-- ---------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------
alter table public.beta_config         enable row level security;
alter table public.profiles            enable row level security;
alter table public.services            enable row level security;
alter table public.provider_profiles   enable row level security;
alter table public.provider_services   enable row level security;
alter table public.availability_rules  enable row level security;
alter table public.bookings            enable row level security;
alter table public.reviews             enable row level security;
alter table public.audit_log           enable row level security;

create policy beta_config_read on public.beta_config for select using (true);

create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.current_role_name() = 'admin');
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy services_read on public.services for select
  using (active or public.current_role_name() = 'admin');

create policy provider_read on public.provider_profiles for select
  using (status = 'verified' or profile_id = auth.uid() or public.current_role_name() = 'admin');
create policy provider_insert_own on public.provider_profiles for insert
  with check (profile_id = auth.uid());
create policy provider_update_own on public.provider_profiles for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy provider_admin_all on public.provider_profiles for all
  using (public.current_role_name() = 'admin') with check (public.current_role_name() = 'admin');

create policy provider_services_read on public.provider_services for select
  using (
    exists (select 1 from public.provider_profiles p
            where p.id = provider_id and (p.status = 'verified' or p.profile_id = auth.uid()))
    or public.current_role_name() = 'admin');
create policy provider_services_write_own on public.provider_services for all
  using (exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid()))
  with check (exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid()));

create policy availability_read on public.availability_rules for select
  using (
    exists (select 1 from public.provider_profiles p
            where p.id = provider_id and (p.status = 'verified' or p.profile_id = auth.uid()))
    or public.current_role_name() = 'admin');
create policy availability_write_own on public.availability_rules for all
  using (exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid()))
  with check (exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid()));

create policy bookings_read on public.bookings for select
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid())
    or public.current_role_name() = 'admin');
create policy bookings_insert_customer on public.bookings for insert
  with check (customer_id = auth.uid() and status = 'requested');
create policy bookings_update_parties on public.bookings for update
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.provider_profiles p where p.id = provider_id and p.profile_id = auth.uid())
    or public.current_role_name() = 'admin')
  with check (true);

create policy reviews_read on public.reviews for select using (true);
create policy reviews_insert_customer on public.reviews for insert
  with check (exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));

create policy audit_admin_read on public.audit_log for select
  using (public.current_role_name() = 'admin');

-- Grants for the public view
grant select on public.public_providers to anon, authenticated;
