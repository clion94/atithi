-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROPERTIES ────────────────────────────────────────────────
create table properties (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  address     text,
  city        text,
  state       text,
  zip         text,
  phone       text,
  email       text,
  timezone    text not null default 'America/Chicago',
  check_in_time  time not null default '15:00',
  check_out_time time not null default '11:00',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── PROFILES (extends Supabase auth.users) ────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  full_name   text,
  role        text not null default 'staff'
                check (role in ('owner', 'manager', 'staff')),
  language    text not null default 'en'
                check (language in ('en', 'gu', 'hi')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── ROOMS ────────────────────────────────────────────────────
create table rooms (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  number      text not null,
  room_type   text not null default 'standard'
                check (room_type in ('standard', 'double', 'suite', 'king', 'smoking', 'accessible')),
  floor       integer,
  capacity    integer not null default 2,
  base_rate   numeric(10,2) not null,
  status      text not null default 'clean'
                check (status in ('clean', 'dirty', 'inspected', 'out_of_order', 'do_not_disturb')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(property_id, number)
);

-- ─── GUESTS ───────────────────────────────────────────────────
create table guests (
  id             uuid primary key default uuid_generate_v4(),
  property_id    uuid not null references properties(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  email          text,
  phone          text,
  id_type        text check (id_type in ('drivers_license', 'passport', 'state_id', 'other')),
  id_number      text,
  address        text,
  city           text,
  state          text,
  zip            text,
  is_banned      boolean not null default false,
  ban_reason     text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── RESERVATIONS ─────────────────────────────────────────────
create table reservations (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid not null references properties(id) on delete cascade,
  room_id         uuid not null references rooms(id),
  guest_id        uuid not null references guests(id),
  check_in_date   date not null,
  check_out_date  date not null,
  actual_check_in  timestamptz,
  actual_check_out timestamptz,
  status          text not null default 'confirmed'
                    check (status in ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  rate_per_night  numeric(10,2) not null,
  adults          integer not null default 1,
  children        integer not null default 0,
  source          text not null default 'walk_in'
                    check (source in ('walk_in', 'phone', 'booking_com', 'expedia', 'direct_web', 'other')),
  special_requests text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint valid_dates check (check_out_date > check_in_date)
);

-- ─── FOLIO ITEMS (billing) ────────────────────────────────────
create table folio_items (
  id              uuid primary key default uuid_generate_v4(),
  reservation_id  uuid not null references reservations(id) on delete cascade,
  property_id     uuid not null references properties(id) on delete cascade,
  description     text not null,
  amount          numeric(10,2) not null,
  item_type       text not null default 'room_charge'
                    check (item_type in ('room_charge', 'tax', 'fee', 'payment', 'credit', 'other')),
  posted_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ─── HOUSEKEEPING LOG ─────────────────────────────────────────
create table housekeeping_log (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  room_id     uuid not null references rooms(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  changed_by  uuid references profiles(id),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────
create index on reservations (property_id, check_in_date, check_out_date);
create index on reservations (property_id, status);
create index on reservations (room_id, check_in_date, check_out_date);
create index on guests (property_id, last_name, first_name);
create index on rooms (property_id, status);
create index on folio_items (reservation_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
alter table properties        enable row level security;
alter table profiles          enable row level security;
alter table rooms             enable row level security;
alter table guests            enable row level security;
alter table reservations      enable row level security;
alter table folio_items       enable row level security;
alter table housekeeping_log  enable row level security;

-- Helper: get current user's property_id
create or replace function get_my_property_id()
returns uuid language sql security definer as $$
  select property_id from profiles where id = auth.uid()
$$;

create policy "property_isolation" on rooms
  using (property_id = get_my_property_id());

create policy "property_isolation" on guests
  using (property_id = get_my_property_id());

create policy "property_isolation" on reservations
  using (property_id = get_my_property_id());

create policy "property_isolation" on folio_items
  using (property_id = get_my_property_id());

create policy "property_isolation" on housekeeping_log
  using (property_id = get_my_property_id());

create policy "own_profile" on profiles
  using (id = auth.uid());

-- Properties: owner/manager can see their own
create policy "own_property" on properties
  using (id = get_my_property_id());

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on properties
  for each row execute function update_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger set_updated_at before update on rooms
  for each row execute function update_updated_at();
create trigger set_updated_at before update on guests
  for each row execute function update_updated_at();
create trigger set_updated_at before update on reservations
  for each row execute function update_updated_at();
