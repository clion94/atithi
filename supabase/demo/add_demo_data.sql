-- Waypoint: add mock data to an EXISTING property (safe for a live database).
-- Run in the Supabase SQL editor. Everything added is tagged '[DEMO]' in `notes`
-- so supabase/demo/remove_demo_data.sql can take it out again.

do $$
declare
  -- Set this to the email you log in with. If your database has exactly one
  -- property you can leave it as is.
  v_email       text := 'test@t.com';

  v_property_id uuid;
  v_count       integer;
  v_tag constant text := '[DEMO]';
begin
  -- ─── Find the target property ──────────────────────────────
  if v_email <> 'YOUR_LOGIN_EMAIL' then
    select p.property_id into v_property_id
    from profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = lower(v_email);

    if v_property_id is null then
      raise exception 'No property is linked to %. Log in once and finish /setup first.', v_email;
    end if;
  else
    select count(*) into v_count from properties;
    if v_count <> 1 then
      raise exception 'Found % properties. Set v_email at the top of this script.', v_count;
    end if;
    select id into v_property_id from properties;
  end if;

  if exists (select 1 from guests where property_id = v_property_id and notes = v_tag) then
    raise notice 'Demo data is already present for this property. Nothing to do.';
    return;
  end if;

  -- ─── Rooms (existing room numbers are left alone) ──────────
  insert into rooms (property_id, number, room_type, floor, capacity, base_rate, status, notes) values
    (v_property_id, '101', 'standard',   1, 2,  69.00, 'clean',          v_tag),
    (v_property_id, '102', 'standard',   1, 2,  69.00, 'dirty',          v_tag),
    (v_property_id, '103', 'double',     1, 4,  89.00, 'clean',          v_tag),
    (v_property_id, '104', 'double',     1, 4,  89.00, 'inspected',      v_tag),
    (v_property_id, '105', 'king',       1, 2,  99.00, 'clean',          v_tag),
    (v_property_id, '106', 'smoking',    1, 2,  64.00, 'dirty',          v_tag),
    (v_property_id, '107', 'accessible', 1, 2,  79.00, 'clean',          v_tag),
    (v_property_id, '201', 'standard',   2, 2,  74.00, 'clean',          v_tag),
    (v_property_id, '202', 'standard',   2, 2,  74.00, 'clean',          v_tag),
    (v_property_id, '203', 'double',     2, 4,  94.00, 'dirty',          v_tag),
    (v_property_id, '204', 'king',       2, 2, 104.00, 'clean',          v_tag),
    (v_property_id, '205', 'suite',      2, 4, 149.00, 'clean',          v_tag),
    (v_property_id, '206', 'smoking',    2, 2,  64.00, 'out_of_order',   v_tag),
    (v_property_id, '207', 'standard',   2, 2,  74.00, 'do_not_disturb', v_tag),
    (v_property_id, '301', 'king',       3, 2, 109.00, 'clean',          v_tag),
    (v_property_id, '302', 'suite',      3, 4, 159.00, 'clean',          v_tag),
    (v_property_id, '303', 'double',     3, 4,  94.00, 'dirty',          v_tag),
    (v_property_id, '304', 'standard',   3, 2,  74.00, 'inspected',      v_tag),
    (v_property_id, '305', 'king',       3, 2, 109.00, 'clean',          v_tag),
    (v_property_id, '306', 'accessible', 3, 2,  79.00, 'clean',          v_tag)
  on conflict (property_id, number) do nothing;

  -- ─── Guests ────────────────────────────────────────────────
  insert into guests (property_id, first_name, last_name, email, phone, id_type, address, city, state, zip, is_banned, ban_reason, notes) values
    (v_property_id, 'Raj',     'Patel',    'raj.patel@example.com',    '(512) 555-0101', 'drivers_license', '123 Oak St',    'Austin',       'TX', '78701', false, null, v_tag),
    (v_property_id, 'Priya',   'Shah',     'priya.shah@example.com',   '(512) 555-0102', 'drivers_license', '456 Maple Ave', 'Round Rock',   'TX', '78664', false, null, v_tag),
    (v_property_id, 'Michael', 'Johnson',  'mjohnson@example.com',     '(737) 555-0103', 'drivers_license', '789 Pine Rd',   'San Antonio',  'TX', '78201', false, null, v_tag),
    (v_property_id, 'Anita',   'Desai',    'anita.desai@example.com',  '(512) 555-0104', 'passport',        '321 Elm St',    'Houston',      'TX', '77001', false, null, v_tag),
    (v_property_id, 'James',   'Wilson',   'jwilson@example.com',      '(512) 555-0105', 'state_id',        '654 Oak Ln',    'Dallas',       'TX', '75201', false, null, v_tag),
    (v_property_id, 'Maria',   'Garcia',   'mgarcia@example.com',      '(512) 555-0106', 'drivers_license', '987 River Rd',  'Austin',       'TX', '78702', false, null, v_tag),
    (v_property_id, 'David',   'Kim',      'dkim@example.com',         '(737) 555-0107', 'passport',        '111 Hill Blvd', 'Cedar Park',   'TX', '78613', false, null, v_tag),
    (v_property_id, 'Sarah',   'Thompson', 'sarah.t@example.com',      '(512) 555-0108', 'drivers_license', '222 Lake Dr',   'Pflugerville', 'TX', '78660', false, null, v_tag),
    (v_property_id, 'Vikram',  'Mehta',    'vmehta@example.com',       '(512) 555-0109', 'drivers_license', '333 Creek Ct',  'Austin',       'TX', '78704', false, null, v_tag),
    (v_property_id, 'Brandon', 'Lee',      'brandon.lee@example.com',  '(512) 555-0110', 'state_id',        '444 Park Way',  'Kyle',         'TX', '78640', true,
       'Property damage and refused to pay', v_tag);

  -- ─── Reservations ──────────────────────────────────────────
  -- Dates are relative to today. A row is skipped if its room already existed
  -- before this script ran (so we never double-book a real room).
  insert into reservations
    (property_id, room_id, guest_id, check_in_date, check_out_date,
     actual_check_in, actual_check_out, status, rate_per_night, adults, children, source, notes)
  select
    v_property_id, r.id, g.id,
    current_date + d.in_off, current_date + d.out_off,
    case when d.status in ('checked_in', 'checked_out')
         then (current_date + d.in_off)::timestamptz + d.in_time end,
    case when d.status = 'checked_out'
         then (current_date + d.out_off)::timestamptz + interval '10 hours' end,
    d.status, r.base_rate, d.adults, d.children, d.source, v_tag
  from (values
    -- room, guest last name, in, out, status, check-in time, adults, children, source
    -- Checked out (history)
    ('101', 'Patel',    -14, -11, 'checked_out', interval '15 hours',  2, 0, 'phone'),
    ('205', 'Desai',    -10,  -7, 'checked_out', interval '16 hours',  2, 1, 'booking_com'),
    ('302', 'Garcia',    -7,  -5, 'checked_out', interval '14 hours',  2, 0, 'expedia'),
    ('104', 'Kim',       -4,  -1, 'checked_out', interval '15 hours',  1, 0, 'direct_web'),
    -- In house
    ('103', 'Shah',      -2,   2, 'checked_in',  interval '15 hours',  2, 0, 'walk_in'),
    ('204', 'Johnson',   -1,   3, 'checked_in',  interval '16 hours',  1, 0, 'phone'),
    ('301', 'Kim',       -3,   1, 'checked_in',  interval '15 hours 30 minutes', 2, 1, 'direct_web'),
    -- Departing today
    ('304', 'Garcia',    -2,   0, 'checked_in',  interval '14 hours',  2, 0, 'walk_in'),
    -- Arriving today
    ('201', 'Wilson',     0,   3, 'confirmed',   null,                 2, 0, 'booking_com'),
    ('105', 'Thompson',   0,   2, 'confirmed',   null,                 2, 0, 'walk_in'),
    -- Upcoming
    ('305', 'Mehta',      2,   5, 'confirmed',   null,                 2, 0, 'phone'),
    ('202', 'Patel',      5,   8, 'confirmed',   null,                 1, 0, 'expedia'),
    ('302', 'Desai',      7,  10, 'confirmed',   null,                 2, 2, 'booking_com'),
    -- Cancelled / no-show
    ('107', 'Johnson',    3,   6, 'cancelled',   null,                 2, 0, 'phone'),
    ('203', 'Wilson',    -5,  -3, 'no_show',     null,                 2, 0, 'booking_com')
  ) as d(room_number, guest_last, in_off, out_off, status, in_time, adults, children, source)
  join rooms  r on r.property_id = v_property_id and r.number = d.room_number and r.notes = v_tag
  join guests g on g.property_id = v_property_id and g.last_name = d.guest_last and g.notes = v_tag;

  -- ─── Folio: one room charge + tax per night stayed so far ──
  insert into folio_items (reservation_id, property_id, description, amount, item_type, posted_at)
  select
    res.id, res.property_id,
    'Room charge — night of ' || to_char(n.night, 'Mon DD'),
    res.rate_per_night, 'room_charge', n.night::timestamptz + interval '23 hours'
  from reservations res
  cross join lateral generate_series(
    res.check_in_date,
    least(res.check_out_date - 1, current_date),
    interval '1 day'
  ) as n(night)
  where res.property_id = v_property_id
    and res.notes = v_tag
    and res.status in ('checked_in', 'checked_out');

  insert into folio_items (reservation_id, property_id, description, amount, item_type, posted_at)
  select
    f.reservation_id, f.property_id, 'Occupancy tax (12%)',
    round(f.amount * 0.12, 2), 'tax', f.posted_at
  from folio_items f
  join reservations res on res.id = f.reservation_id
  where res.property_id = v_property_id
    and res.notes = v_tag
    and f.item_type = 'room_charge';

  raise notice 'Demo data added to property %.', v_property_id;
end
$$;
