-- 003: security hardening and data integrity
--
--  1. Profiles can no longer be inserted/deleted by users, and users can only
--     update full_name / language (previously they could change their own role
--     or point property_id at another property).
--  2. Row level security is split per command, with role checks:
--     staff work day to day; owners/managers manage rooms, rates, bans, deletes.
--  3. Double bookings are impossible (exclusion constraint on room + dates).
--  4. Reservation rules live in the database so every client gets them
--     atomically: room/guest must belong to the property, no banned guests, no
--     out-of-order rooms, valid status transitions, check-in/out timestamps,
--     and checkout marks the room dirty in the same transaction.
--  5. housekeeping_log is written only by a trigger (append-only for clients).
--  6. Missing indexes.

-- ─── 1. Helper functions ─────────────────────────────────────
create or replace function get_my_property_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select property_id from profiles where id = auth.uid()
$$;

create or replace function get_my_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- True for owners and managers. Staff and anonymous callers get false.
create or replace function is_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(get_my_role() in ('owner', 'manager'), false)
$$;

-- ─── 2. Profiles ─────────────────────────────────────────────
drop policy if exists "own_profile" on profiles;

create policy "profiles_select_own" on profiles
  for select using (id = (select auth.uid()));

create policy "profiles_update_own" on profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Profiles are created by create_property_for_user() (security definer).
-- Column privileges stop users from editing role / property_id themselves.
revoke insert, delete on profiles from anon, authenticated;
revoke update on profiles from anon, authenticated;
grant update (full_name, language) on profiles to authenticated;

-- ─── 3. Properties ───────────────────────────────────────────
drop policy if exists "own_property" on properties;
drop policy if exists "own_property_select" on properties;
drop policy if exists "own_property_update" on properties;

create policy "properties_select" on properties
  for select using (id = (select get_my_property_id()));

create policy "properties_update" on properties
  for update using (id = (select get_my_property_id()) and (select is_manager()))
  with check (id = (select get_my_property_id()));

-- A property can only be created via create_property_for_user(), and never
-- deleted from the client.
revoke insert, delete on properties from anon, authenticated;

-- ─── 4. Rooms ────────────────────────────────────────────────
drop policy if exists "property_isolation" on rooms;

create policy "rooms_select" on rooms
  for select using (property_id = (select get_my_property_id()));
create policy "rooms_insert" on rooms
  for insert with check (property_id = (select get_my_property_id()) and (select is_manager()));
create policy "rooms_update" on rooms
  for update using (property_id = (select get_my_property_id()))
  with check (property_id = (select get_my_property_id()));
create policy "rooms_delete" on rooms
  for delete using (property_id = (select get_my_property_id()) and (select is_manager()));

-- Staff (housekeeping) may change status and notes only.
create or replace function rooms_guard_staff_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_manager()
     and (new.property_id, new.number, new.room_type, new.floor, new.capacity, new.base_rate)
         is distinct from
         (old.property_id, old.number, old.room_type, old.floor, old.capacity, old.base_rate)
  then
    raise exception 'Only an owner or manager can change room details or rates'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger rooms_guard_staff_columns
  before update on rooms
  for each row execute function rooms_guard_staff_columns();

-- ─── 5. Housekeeping log (written by trigger only) ───────────
drop policy if exists "property_isolation" on housekeeping_log;

create policy "housekeeping_log_select" on housekeeping_log
  for select using (property_id = (select get_my_property_id()));

revoke insert, update, delete on housekeeping_log from anon, authenticated;

create or replace function rooms_log_status_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status or new.notes is distinct from old.notes then
    insert into housekeeping_log (property_id, room_id, old_status, new_status, changed_by, notes)
    values (new.property_id, new.id, old.status, new.status, auth.uid(), new.notes);
  end if;
  return new;
end;
$$;

create trigger rooms_log_status_change
  after update on rooms
  for each row execute function rooms_log_status_change();

-- ─── 6. Guests ───────────────────────────────────────────────
drop policy if exists "property_isolation" on guests;

create policy "guests_select" on guests
  for select using (property_id = (select get_my_property_id()));
create policy "guests_insert" on guests
  for insert with check (property_id = (select get_my_property_id()));
create policy "guests_update" on guests
  for update using (property_id = (select get_my_property_id()))
  with check (property_id = (select get_my_property_id()));
create policy "guests_delete" on guests
  for delete using (property_id = (select get_my_property_id()) and (select is_manager()));

-- Only owners/managers may ban or unban.
create or replace function guests_guard_ban()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_changed boolean;
begin
  if tg_op = 'INSERT' then
    v_changed := new.is_banned or new.ban_reason is not null;
  else
    v_changed := (new.is_banned, new.ban_reason) is distinct from (old.is_banned, old.ban_reason);
  end if;

  if v_changed and auth.uid() is not null and not is_manager() then
    raise exception 'Only an owner or manager can ban or unban a guest'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guests_guard_ban
  before insert or update on guests
  for each row execute function guests_guard_ban();

-- ─── 7. Reservations ─────────────────────────────────────────
drop policy if exists "property_isolation" on reservations;

create policy "reservations_select" on reservations
  for select using (property_id = (select get_my_property_id()));
create policy "reservations_insert" on reservations
  for insert with check (property_id = (select get_my_property_id()));
create policy "reservations_update" on reservations
  for update using (property_id = (select get_my_property_id()))
  with check (property_id = (select get_my_property_id()));
create policy "reservations_delete" on reservations
  for delete using (property_id = (select get_my_property_id()) and (select is_manager()));

-- Double-booking guard. Back-to-back stays (out on the 5th, in on the 5th) are
-- allowed because the range is [check_in, check_out).
create extension if not exists btree_gist;

do $$
declare
  v_overlaps integer;
begin
  select count(*) into v_overlaps
  from reservations a
  join reservations b
    on a.room_id = b.room_id
   and a.id < b.id
   and daterange(a.check_in_date, a.check_out_date) && daterange(b.check_in_date, b.check_out_date)
  where a.status in ('confirmed', 'checked_in')
    and b.status in ('confirmed', 'checked_in');

  if v_overlaps > 0 then
    raise exception
      '% overlapping active reservations already exist. Cancel or move them, then re-run this migration.',
      v_overlaps;
  end if;
end
$$;

alter table reservations
  add constraint reservations_no_double_booking
  exclude using gist (
    room_id with =,
    daterange(check_in_date, check_out_date) with &&
  ) where (status in ('confirmed', 'checked_in'));

create or replace function reservations_enforce_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_room  rooms;
  v_guest guests;
  v_check boolean;
begin
  if tg_op = 'INSERT' then
    -- Signed-in users can only create new bookings or walk-ins. (Admin SQL,
    -- e.g. the demo scripts, may insert historical rows.)
    if auth.uid() is not null and new.status not in ('confirmed', 'checked_in') then
      raise exception 'A reservation must start as confirmed or checked in'
        using errcode = '23514';
    end if;
  else
    if new.property_id <> old.property_id then
      raise exception 'A reservation cannot be moved to another property'
        using errcode = '42501';
    end if;

    if new.status <> old.status and not (
         (old.status = 'confirmed'  and new.status in ('checked_in', 'cancelled', 'no_show'))
      or (old.status = 'checked_in' and new.status = 'checked_out')
    ) then
      raise exception 'Cannot change a reservation from % to %', old.status, new.status
        using errcode = '23514';
    end if;
  end if;

  -- Room and guest must exist in this property (RLS hides other properties'
  -- rows, so a foreign id also shows up as "not found").
  v_check := tg_op = 'INSERT'
          or new.room_id  is distinct from old.room_id
          or new.guest_id is distinct from old.guest_id
          or (new.status = 'checked_in' and old.status is distinct from 'checked_in');

  if v_check then
    select * into v_room from rooms where id = new.room_id;
    if not found or v_room.property_id <> new.property_id then
      raise exception 'Room not found' using errcode = '23503';
    end if;
    if v_room.status = 'out_of_order' then
      raise exception 'Room % is out of order', v_room.number using errcode = '23514';
    end if;

    select * into v_guest from guests where id = new.guest_id;
    if not found or v_guest.property_id <> new.property_id then
      raise exception 'Guest not found' using errcode = '23503';
    end if;
    if v_guest.is_banned then
      raise exception '% % is banned%', v_guest.first_name, v_guest.last_name,
        coalesce(': ' || v_guest.ban_reason, '') using errcode = '23514';
    end if;
  end if;

  -- Timestamps are set by the database, not the client clock.
  if new.status = 'checked_in' and (tg_op = 'INSERT' or old.status is distinct from 'checked_in') then
    new.actual_check_in := coalesce(new.actual_check_in, now());
  end if;
  if new.status = 'checked_out' and (tg_op = 'INSERT' or old.status is distinct from 'checked_out') then
    new.actual_check_out := coalesce(new.actual_check_out, now());
  end if;

  return new;
end;
$$;

create trigger reservations_enforce_rules
  before insert or update on reservations
  for each row execute function reservations_enforce_rules();

-- Checking out marks the room dirty in the same transaction.
create or replace function reservations_after_checkout()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'checked_out' and old.status is distinct from 'checked_out' then
    update rooms set status = 'dirty'
    where id = new.room_id and status <> 'out_of_order';
  end if;
  return new;
end;
$$;

create trigger reservations_after_checkout
  after update on reservations
  for each row execute function reservations_after_checkout();

-- ─── 8. Folio items ──────────────────────────────────────────
drop policy if exists "property_isolation" on folio_items;

create policy "folio_items_select" on folio_items
  for select using (property_id = (select get_my_property_id()));
create policy "folio_items_insert" on folio_items
  for insert with check (
    property_id = (select get_my_property_id())
    and exists (
      select 1 from reservations r
      where r.id = folio_items.reservation_id and r.property_id = folio_items.property_id
    )
  );
create policy "folio_items_update" on folio_items
  for update using (property_id = (select get_my_property_id()))
  with check (property_id = (select get_my_property_id()));
create policy "folio_items_delete" on folio_items
  for delete using (property_id = (select get_my_property_id()) and (select is_manager()));

-- ─── 9. Indexes ──────────────────────────────────────────────
create index if not exists reservations_guest_id_idx on reservations (guest_id);
create index if not exists folio_items_property_id_idx on folio_items (property_id);
create index if not exists profiles_property_id_idx on profiles (property_id);
create index if not exists housekeeping_log_property_created_idx
  on housekeeping_log (property_id, created_at desc);
create index if not exists housekeeping_log_room_created_idx
  on housekeeping_log (room_id, created_at desc);
