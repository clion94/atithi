-- Atithi PMS Demo Seed Data
-- Run after 001_initial_schema.sql

-- ─── DEMO PROPERTY ───────────────────────────────────────────
INSERT INTO properties (id, name, address, city, state, zip, phone, email, timezone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sunshine Motel',
  '1845 E Riverside Dr',
  'Austin',
  'TX',
  '78741',
  '(512) 555-0142',
  'front@sunshineaustin.com',
  'America/Chicago'
);

-- ─── ROOMS (20 rooms, mix of types and statuses) ─────────────
INSERT INTO rooms (property_id, number, room_type, floor, capacity, base_rate, status) VALUES
('00000000-0000-0000-0000-000000000001', '101', 'standard',  1, 2,  69.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '102', 'standard',  1, 2,  69.00, 'dirty'),
('00000000-0000-0000-0000-000000000001', '103', 'double',    1, 4,  89.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '104', 'double',    1, 4,  89.00, 'inspected'),
('00000000-0000-0000-0000-000000000001', '105', 'king',      1, 2,  99.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '106', 'smoking',   1, 2,  64.00, 'dirty'),
('00000000-0000-0000-0000-000000000001', '107', 'accessible',1, 2,  79.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '201', 'standard',  2, 2,  74.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '202', 'standard',  2, 2,  74.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '203', 'double',    2, 4,  94.00, 'dirty'),
('00000000-0000-0000-0000-000000000001', '204', 'king',      2, 2, 104.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '205', 'suite',     2, 4, 149.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '206', 'smoking',   2, 2,  64.00, 'out_of_order'),
('00000000-0000-0000-0000-000000000001', '207', 'standard',  2, 2,  74.00, 'do_not_disturb'),
('00000000-0000-0000-0000-000000000001', '301', 'king',      3, 2, 109.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '302', 'suite',     3, 4, 159.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '303', 'double',    3, 4,  94.00, 'dirty'),
('00000000-0000-0000-0000-000000000001', '304', 'standard',  3, 2,  74.00, 'inspected'),
('00000000-0000-0000-0000-000000000001', '305', 'king',      3, 2, 109.00, 'clean'),
('00000000-0000-0000-0000-000000000001', '306', 'accessible',3, 2,  79.00, 'clean');

-- ─── GUESTS ──────────────────────────────────────────────────
INSERT INTO guests (id, property_id, first_name, last_name, email, phone, id_type, address, city, state, zip, is_banned) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Raj',     'Patel',    'raj.patel@gmail.com',    '(512) 555-0101', 'drivers_license', '123 Oak St',    'Austin',       'TX', '78701', false),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Priya',   'Shah',     'priya.shah@yahoo.com',   '(512) 555-0102', 'drivers_license', '456 Maple Ave', 'Round Rock',   'TX', '78664', false),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Michael', 'Johnson',  'mjohnson@gmail.com',     '(737) 555-0103', 'drivers_license', '789 Pine Rd',   'San Antonio',  'TX', '78201', false),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Anita',   'Desai',    'anita.d@hotmail.com',    '(512) 555-0104', 'passport',        '321 Elm St',    'Houston',      'TX', '77001', false),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'James',   'Wilson',   'jwilson@gmail.com',      '(512) 555-0105', 'state_id',        '654 Oak Ln',    'Dallas',       'TX', '75201', false),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Maria',   'Garcia',   'mgarcia@gmail.com',      '(512) 555-0106', 'drivers_license', '987 River Rd',  'Austin',       'TX', '78702', false),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'David',   'Kim',      'dkim@outlook.com',       '(737) 555-0107', 'passport',        '111 Hill Blvd', 'Cedar Park',   'TX', '78613', false),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Sarah',   'Thompson', 'sarah.t@gmail.com',      '(512) 555-0108', 'drivers_license', '222 Lake Dr',   'Pflugerville', 'TX', '78660', false),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Vikram',  'Mehta',    'vmehta@gmail.com',       '(512) 555-0109', 'drivers_license', '333 Creek Ct',  'Austin',       'TX', '78704', false),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Brandon', 'Lee',      'brandon.lee@yahoo.com',  '(512) 555-0110', 'state_id',        '444 Park Way',  'Kyle',         'TX', '78640', true);

-- Set ban reason for Brandon Lee
UPDATE guests SET ban_reason = 'Property damage and refused to pay — 03/2025' WHERE id = '10000000-0000-0000-0000-000000000010';

-- ─── RESERVATIONS ────────────────────────────────────────────
-- Use dynamic dates relative to current date for realistic demo

-- Past reservations (checked out)
INSERT INTO reservations (property_id, room_id, guest_id, check_in_date, check_out_date, actual_check_in, actual_check_out, status, rate_per_night, adults, children, source) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='101'),
  '10000000-0000-0000-0000-000000000001',
  CURRENT_DATE - 14, CURRENT_DATE - 11,
  (CURRENT_DATE - 14)::timestamptz + interval '15 hours',
  (CURRENT_DATE - 11)::timestamptz + interval '10 hours',
  'checked_out', 69.00, 2, 0, 'phone'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='205'),
  '10000000-0000-0000-0000-000000000004',
  CURRENT_DATE - 10, CURRENT_DATE - 7,
  (CURRENT_DATE - 10)::timestamptz + interval '16 hours',
  (CURRENT_DATE - 7)::timestamptz + interval '11 hours',
  'checked_out', 149.00, 2, 1, 'booking_com'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='302'),
  '10000000-0000-0000-0000-000000000006',
  CURRENT_DATE - 7, CURRENT_DATE - 5,
  (CURRENT_DATE - 7)::timestamptz + interval '14 hours',
  (CURRENT_DATE - 5)::timestamptz + interval '10 hours 30 minutes',
  'checked_out', 159.00, 2, 0, 'expedia'
),

-- Currently checked in (in-house guests)
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='103'),
  '10000000-0000-0000-0000-000000000002',
  CURRENT_DATE - 2, CURRENT_DATE + 2,
  (CURRENT_DATE - 2)::timestamptz + interval '15 hours',
  NULL,
  'checked_in', 89.00, 2, 0, 'walk_in'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='204'),
  '10000000-0000-0000-0000-000000000003',
  CURRENT_DATE - 1, CURRENT_DATE + 3,
  (CURRENT_DATE - 1)::timestamptz + interval '16 hours',
  NULL,
  'checked_in', 104.00, 1, 0, 'phone'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='301'),
  '10000000-0000-0000-0000-000000000007',
  CURRENT_DATE - 3, CURRENT_DATE + 1,
  (CURRENT_DATE - 3)::timestamptz + interval '15 hours 30 minutes',
  NULL,
  'checked_in', 109.00, 2, 1, 'direct_web'
),

-- Today's arrivals (confirmed, check-in today)
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='201'),
  '10000000-0000-0000-0000-000000000005',
  CURRENT_DATE, CURRENT_DATE + 3,
  NULL, NULL,
  'confirmed', 74.00, 2, 0, 'booking_com'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='105'),
  '10000000-0000-0000-0000-000000000008',
  CURRENT_DATE, CURRENT_DATE + 2,
  NULL, NULL,
  'confirmed', 99.00, 2, 0, 'walk_in'
),

-- Future reservations
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='305'),
  '10000000-0000-0000-0000-000000000009',
  CURRENT_DATE + 2, CURRENT_DATE + 5,
  NULL, NULL,
  'confirmed', 109.00, 2, 0, 'phone'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='202'),
  '10000000-0000-0000-0000-000000000001',
  CURRENT_DATE + 5, CURRENT_DATE + 8,
  NULL, NULL,
  'confirmed', 74.00, 1, 0, 'expedia'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='302'),
  '10000000-0000-0000-0000-000000000004',
  CURRENT_DATE + 7, CURRENT_DATE + 10,
  NULL, NULL,
  'confirmed', 159.00, 2, 2, 'booking_com'
),

-- Departures today (checked in, check-out today)
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='304'),
  '10000000-0000-0000-0000-000000000006',
  CURRENT_DATE - 2, CURRENT_DATE,
  (CURRENT_DATE - 2)::timestamptz + interval '14 hours',
  NULL,
  'checked_in', 74.00, 2, 0, 'walk_in'
),

-- Cancelled reservation
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='107'),
  '10000000-0000-0000-0000-000000000003',
  CURRENT_DATE + 3, CURRENT_DATE + 6,
  NULL, NULL,
  'cancelled', 79.00, 2, 0, 'phone'
),

-- No show
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE property_id='00000000-0000-0000-0000-000000000001' AND number='203'),
  '10000000-0000-0000-0000-000000000005',
  CURRENT_DATE - 5, CURRENT_DATE - 3,
  NULL, NULL,
  'no_show', 94.00, 2, 0, 'booking_com'
);

-- ─── FOLIO ITEMS for in-house guests ─────────────────────────
-- Night charges for in-house guests
INSERT INTO folio_items (reservation_id, property_id, description, amount, item_type)
SELECT
  r.id,
  r.property_id,
  'Room charge — ' || ro.number || ' (' || ro.room_type || ')',
  r.rate_per_night,
  'room_charge'
FROM reservations r
JOIN rooms ro ON ro.id = r.room_id
WHERE r.status = 'checked_in';

-- Tax items (12% occupancy tax)
INSERT INTO folio_items (reservation_id, property_id, description, amount, item_type)
SELECT
  r.id,
  r.property_id,
  'Occupancy tax (12%)',
  ROUND(r.rate_per_night * 0.12, 2),
  'tax'
FROM reservations r
WHERE r.status = 'checked_in';
