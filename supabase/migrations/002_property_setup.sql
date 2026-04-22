-- RLS policies for properties table
-- New users need to create a property before get_my_property_id() returns anything,
-- so direct INSERT is impossible under standard RLS. We use a SECURITY DEFINER
-- function to create the property and link the profile atomically.

create policy "own_property_select" on properties
  for select using (id = get_my_property_id());

create policy "own_property_update" on properties
  for update using (id = get_my_property_id());

-- Atomic setup: creates a property and links the calling user's profile to it.
-- SECURITY DEFINER lets it bypass RLS (runs as the function owner, not the caller).
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
  v_user_id    uuid;
  v_property   properties;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Prevent creating a second property
  if exists (select 1 from profiles where id = v_user_id and property_id is not null) then
    raise exception 'User already has a property';
  end if;

  insert into properties (name, timezone, check_in_time, check_out_time, phone, email, address, city, state, zip)
  values (p_name, p_timezone, p_check_in_time::time, p_check_out_time::time, p_phone, p_email, p_address, p_city, p_state, p_zip)
  returning * into v_property;

  -- Upsert profile: create if missing, update property_id if it exists
  insert into profiles (id, property_id, full_name, role)
  values (v_user_id, v_property.id, p_full_name, 'owner')
  on conflict (id) do update
    set property_id = v_property.id,
        full_name   = coalesce(excluded.full_name, profiles.full_name),
        updated_at  = now();

  return next v_property;
end;
$$;
