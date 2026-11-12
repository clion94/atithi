-- 004: staff accounts, audit trail, ID documents, registration/invoice fields
--
--  1. Team: profiles get an email and an `active` flag. Deactivated staff lose all
--     access immediately (their helper functions return nothing), and a property can
--     never be left without an active owner.
--  2. Audit trail: activity_log records who did what (bookings, check-in/out, bans,
--     rate changes, ID documents, staff changes). Written only by triggers or the
--     server; readable by owners/managers.
--  3. ID documents: private storage bucket + guest_documents table, scoped per property.
--  4. reservations.vehicle_plate (registration card), properties.tax_rate (invoice).

-- ─── 1. Team ─────────────────────────────────────────────────
alter table profiles
  add column if not exists email  text,
  add column if not exists active boolean not null default true;

update profiles p set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Deactivated users resolve to "no property / no role", so every RLS policy and role
-- check in the schema stops working for them without touching each policy.
create or replace function get_my_property_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select property_id from profiles where id = auth.uid() and active
$$;

create or replace function get_my_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid() and active
$$;

-- Owners/managers can see their team. Everyone can still read their own row (needed to
-- notice that an account was deactivated).
create policy "profiles_select_team" on profiles
  for select using (
    property_id = (select get_my_property_id()) and (select is_manager())
  );

-- A property must always keep at least one active owner.
create or replace function profiles_keep_an_owner()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Cascades from deleting a property/user are intentional; only guard direct changes.
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if old.role = 'owner' and old.active and old.property_id is not null
     and (tg_op = 'DELETE'
          or new.role <> 'owner'
          or not new.active
          or new.property_id is distinct from old.property_id)
     and not exists (
       select 1 from profiles p
       where p.property_id = old.property_id and p.role = 'owner' and p.active and p.id <> old.id
     )
  then
    raise exception 'A property must keep at least one active owner'
      using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger profiles_keep_an_owner
  before update or delete on profiles
  for each row execute function profiles_keep_an_owner();

-- New properties record the owner's email too.
create or replace function create_property_for_user(
  p_name           text,
  p_timezone       text    default 'America/Chicago',
  p_check_in_time  text    default '15:00',
  p_check_out_time text    default '11:00',
  p_full_name      text    default null,
  p_phone          text    default null,
  p_email          text    default null,
  p_address        text    default null,
  p_city           text    default null,
  p_state          text    default null,
  p_zip            text    default null
)
returns setof properties
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid;
  v_email    text;
  v_property properties;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from profiles where id = v_user_id and property_id is not null) then
    raise exception 'User already has a property';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into properties (name, timezone, check_in_time, check_out_time, phone, email, address, city, state, zip)
  values (p_name, p_timezone, p_check_in_time::time, p_check_out_time::time, p_phone, p_email, p_address, p_city, p_state, p_zip)
  returning * into v_property;

  insert into profiles (id, property_id, full_name, role, email)
  values (v_user_id, v_property.id, p_full_name, 'owner', v_email)
  on conflict (id) do update
    set property_id = v_property.id,
        full_name   = coalesce(excluded.full_name, profiles.full_name),
        email       = coalesce(excluded.email, profiles.email),
        updated_at  = now();

  return next v_property;
end;
$$;

-- ─── 2. Audit trail ──────────────────────────────────────────
create table activity_log (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  summary     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index activity_log_property_created_idx on activity_log (property_id, created_at desc);
create index activity_log_actor_idx on activity_log (actor_id);

alter table activity_log enable row level security;

create policy "activity_log_select" on activity_log
  for select using (property_id = (select get_my_property_id()) and (select is_manager()));

-- Append-only for everyone except the triggers/server below.
revoke insert, update, delete on activity_log from anon, authenticated;

create or replace function log_activity(
  p_property_id uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid,
  p_summary     jsonb default '{}'::jsonb
)
returns void
language sql security definer
set search_path = public
as $$
  insert into activity_log (property_id, actor_id, action, entity_type, entity_id, summary)
  values (p_property_id, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_summary, '{}'::jsonb))
$$;

revoke execute on function log_activity(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

-- Reservations: created + every status change.
create or replace function reservations_log_activity()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_guest text;
  v_room  text;
  v_info  jsonb;
begin
  select first_name || ' ' || last_name into v_guest from guests where id = new.guest_id;
  select number into v_room from rooms where id = new.room_id;
  v_info := jsonb_build_object(
    'guest', v_guest, 'room', v_room,
    'check_in', new.check_in_date, 'check_out', new.check_out_date
  );

  if tg_op = 'INSERT' then
    perform log_activity(new.property_id, 'reservation_created', 'reservation', new.id, v_info);
    if new.status <> 'confirmed' then
      perform log_activity(new.property_id, new.status, 'reservation', new.id, v_info);
    end if;
  elsif new.status is distinct from old.status then
    perform log_activity(new.property_id, new.status, 'reservation', new.id, v_info);
  end if;
  return new;
end;
$$;

create trigger reservations_log_activity
  after insert or update on reservations
  for each row execute function reservations_log_activity();

-- Guests: bans and unbans.
create or replace function guests_log_activity()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.is_banned is distinct from old.is_banned then
    perform log_activity(
      new.property_id,
      case when new.is_banned then 'guest_banned' else 'guest_unbanned' end,
      'guest', new.id,
      jsonb_build_object('guest', new.first_name || ' ' || new.last_name, 'reason', new.ban_reason)
    );
  end if;
  return new;
end;
$$;

create trigger guests_log_activity
  after update on guests
  for each row execute function guests_log_activity();

-- Rooms: rate changes (status changes already go to housekeeping_log).
create or replace function rooms_log_activity()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.base_rate is distinct from old.base_rate then
    perform log_activity(
      new.property_id, 'room_rate_changed', 'room', new.id,
      jsonb_build_object('room', new.number, 'from', old.base_rate, 'to', new.base_rate)
    );
  end if;
  return new;
end;
$$;

create trigger rooms_log_activity
  after update on rooms
  for each row execute function rooms_log_activity();

-- ─── 3. ID documents ─────────────────────────────────────────
create table guest_documents (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references properties(id) on delete cascade,
  guest_id     uuid not null references guests(id) on delete cascade,
  storage_path text not null unique,
  kind         text not null default 'id_front'
                 check (kind in ('id_front', 'id_back', 'other')),
  uploaded_by  uuid references profiles(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  -- Files live under <property_id>/<guest_id>/..., which is also what the storage
  -- policies below check, so a row can never point at another property's folder.
  constraint guest_documents_path_matches
    check (storage_path like property_id::text || '/' || guest_id::text || '/%')
);

create index guest_documents_guest_idx on guest_documents (guest_id);
create index guest_documents_property_idx on guest_documents (property_id);

alter table guest_documents enable row level security;

create policy "guest_documents_select" on guest_documents
  for select using (property_id = (select get_my_property_id()));
create policy "guest_documents_insert" on guest_documents
  for insert with check (
    property_id = (select get_my_property_id())
    and exists (
      select 1 from guests g
      where g.id = guest_documents.guest_id and g.property_id = guest_documents.property_id
    )
  );
create policy "guest_documents_delete" on guest_documents
  for delete using (property_id = (select get_my_property_id()) and (select is_manager()));

revoke update on guest_documents from anon, authenticated;

create or replace function guest_documents_log_activity()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_row   guest_documents;
  v_guest text;
begin
  -- Rows removed by a cascade (deleting a guest or property) are not user actions.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  v_row := case when tg_op = 'DELETE' then old else new end;
  select first_name || ' ' || last_name into v_guest from guests where id = v_row.guest_id;
  perform log_activity(
    v_row.property_id,
    case when tg_op = 'DELETE' then 'id_document_removed' else 'id_document_added' end,
    'guest', v_row.guest_id,
    jsonb_build_object('guest', v_guest, 'kind', v_row.kind)
  );
  return v_row;
end;
$$;

create trigger guest_documents_log_activity
  after insert or delete on guest_documents
  for each row execute function guest_documents_log_activity();

-- Private bucket: images only, 5 MB max, one folder per property.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guest-ids', 'guest-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "guest_ids_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'guest-ids' and (storage.foldername(name))[1] = (select get_my_property_id())::text);
create policy "guest_ids_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'guest-ids' and (storage.foldername(name))[1] = (select get_my_property_id())::text);
create policy "guest_ids_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'guest-ids'
    and (storage.foldername(name))[1] = (select get_my_property_id())::text
    and (select is_manager())
  );

-- ─── 4. Registration card + invoice fields ───────────────────
alter table reservations
  add column if not exists vehicle_plate text
    check (vehicle_plate is null or char_length(vehicle_plate) <= 20);

alter table properties
  add column if not exists tax_rate numeric(5,2) not null default 0
    check (tax_rate >= 0 and tax_rate <= 100);
