-- Adversarial tests for RLS, roles and reservation rules (migration 003).
-- Run with supabase/tests/run.sh. Any failure raises an error and exits non-zero.
insert into auth.users values ('aaaaaaaa-0000-0000-0000-000000000001','owner1@x'),('bbbbbbbb-0000-0000-0000-000000000002','staff1@x'),('cccccccc-0000-0000-0000-000000000003','owner2@x');
set role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
select name from create_property_for_user('Motel One');
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000003',false);
select name from create_property_for_user('Motel Two');
reset role;
-- staff member of property one (admin action: there is no invite flow yet)
insert into profiles(id, property_id, role) select 'bbbbbbbb-0000-0000-0000-000000000002', property_id, 'staff' from profiles where id='aaaaaaaa-0000-0000-0000-000000000001';

-- ===== owner1 sets up rooms and guests
set role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
insert into rooms(property_id,number,base_rate) select get_my_property_id(), n, 80 from unnest(array['101','102','103']) n;
insert into guests(property_id,first_name,last_name) select get_my_property_id(), f, 'T' from unnest(array['Ann','Bob','Cy']) f;
update guests set is_banned=true, ban_reason='damage' where first_name='Cy';
select t.eq('owner sees 3 rooms', (select count(*) from rooms), 3::bigint);

-- ===== privilege escalation attempts as staff
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',false);
select t.fails($$update profiles set role='owner' where id=auth.uid()$$, 'permission denied');
select t.fails($$update profiles set property_id=(select id from properties where name='Motel Two') where id=auth.uid()$$, 'permission denied');
select t.fails($$insert into profiles(id,role) values (gen_random_uuid(),'owner')$$, 'permission denied');
select t.fails($$delete from properties$$, 'permission denied');
select t.fails($$insert into rooms(property_id,number,base_rate) values (get_my_property_id(),'999',1)$$, 'row-level security');
select t.fails($$update rooms set base_rate=1 where number='101'$$, 'owner or manager');
select t.fails($$update guests set is_banned=true where first_name='Ann'$$, 'owner or manager');

-- ===== reservation rules
reset role;
insert into rooms(property_id,number,base_rate) select property_id,'901',50 from profiles where id='cccccccc-0000-0000-0000-000000000003';
select id as p2_room from rooms where number='901' \gset
insert into guests(property_id,first_name,last_name) select property_id,'Zed','Other' from profiles where id='cccccccc-0000-0000-0000-000000000003';
select id as p2_guest from guests where first_name='Zed' \gset
select id as p2_prop from properties where name='Motel Two' \gset
select id as r101 from rooms where number='101' \gset
select id as r102 from rooms where number='102' \gset
select id as r103 from rooms where number='103' \gset
select id as g_ann from guests where first_name='Ann' \gset
select id as g_bob from guests where first_name='Bob' \gset
select id as g_cy from guests where first_name='Cy' \gset

set role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night)
  values (get_my_property_id(), :'r101', :'g_ann', current_date+1, current_date+4, 80);
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(),%L,%L,current_date+2,current_date+5,80)$$, :'r101', :'g_bob'), 'reservations_no_double_booking');
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night)
  values (get_my_property_id(), :'r101', :'g_bob', current_date+4, current_date+6, 80);
select t.eq('back-to-back stay allowed', (select count(*) from reservations where room_id=:'r101'), 2::bigint);
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(),%L,%L,current_date+10,current_date+11,80)$$, :'r103', :'g_cy'), 'is banned: damage');
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(),%L,%L,current_date+10,current_date+11,80)$$, :'p2_room', :'g_ann'), 'Room not found');
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(),%L,%L,current_date+10,current_date+11,80)$$, :'r103', :'p2_guest'), 'Guest not found');
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (%L,%L,%L,current_date+10,current_date+11,80)$$, :'p2_prop', :'p2_room', :'p2_guest'), 'not found');
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night,status) values (get_my_property_id(),%L,%L,current_date-5,current_date-3,80,'checked_out')$$, :'r103', :'g_ann'), 'must start as confirmed');

-- state machine + timestamps + checkout side effects
select id as res1 from reservations where room_id=:'r101' and check_in_date=current_date+1 \gset
select t.fails(format($$update reservations set status='checked_out' where id=%L$$, :'res1'), 'Cannot change a reservation from confirmed to checked_out');
update reservations set status='checked_in' where id=:'res1';
select t.eq('check-in timestamp set by DB', (select actual_check_in is not null from reservations where id=:'res1'), true);
select t.fails(format($$update reservations set status='cancelled' where id=%L$$, :'res1'), 'from checked_in to cancelled');
update reservations set status='checked_out' where id=:'res1';
select t.eq('room dirty after checkout', (select status from rooms where id=:'r101'), 'dirty');
select t.eq('checkout timestamp', (select actual_check_out is not null from reservations where id=:'res1'), true);
select t.eq('housekeeping row written by trigger with actor', (select count(*) from housekeeping_log where room_id=:'r101' and new_status='dirty' and changed_by='aaaaaaaa-0000-0000-0000-000000000001'), 1::bigint);
select t.fails(format($$update reservations set status='confirmed' where id=%L$$, :'res1'), 'from checked_out to confirmed');
select t.fails(format($$update reservations set property_id=%L where id=%L$$, :'p2_prop', :'res1'), 'another property');

-- cancelled frees the slot
select id as res2 from reservations where room_id=:'r101' and check_in_date=current_date+4 \gset
update reservations set status='cancelled' where id=:'res2';
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night)
  values (get_my_property_id(), :'r101', :'g_ann', current_date+4, current_date+6, 80);
select t.eq('slot reusable after cancel', (select count(*) from reservations where status='confirmed'), 1::bigint);

-- staff: can do housekeeping + bookings, cannot delete, cannot write the log
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',false);
update rooms set status='out_of_order', notes='broken AC' where id=:'r102';
select t.eq('staff can change room status', (select status from rooms where id=:'r102'), 'out_of_order');
select t.fails(format($$insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(),%L,%L,current_date,current_date+1,80)$$, :'r102', :'g_ann'), 'out of order');
select t.fails($$insert into housekeeping_log(property_id,room_id,new_status) select property_id,id,'clean' from rooms limit 1$$, 'permission denied');
select t.fails($$update housekeeping_log set notes='x'$$, 'permission denied');
delete from reservations;
select t.eq('staff delete removes nothing', (select count(*) from reservations), 3::bigint);
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night)
  values (get_my_property_id(), :'r103', :'g_bob', current_date, current_date+1, 80);
select t.eq('staff can create bookings', (select count(*) from reservations), 4::bigint);
with u as (update profiles set full_name='Sam' where id=auth.uid() returning 1) select t.eq('staff can update own name', (select count(*) from u), 1::bigint);

-- manager can delete + ban; other tenant sees nothing
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
with u as (update rooms set base_rate=90 where id=:'r101' returning 1) select t.eq('owner can bump rate', (select count(*) from u), 1::bigint);
with d as (delete from reservations where status='cancelled' returning 1) select t.eq('owner can delete', (select count(*) from d), 1::bigint);
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000003',false);
select t.eq('tenant 2 sees only own rooms', (select count(*) from rooms), 1::bigint);
select t.eq('tenant 2 sees no reservations', (select count(*) from reservations), 0::bigint);
select t.eq('tenant 2 sees no guests of tenant 1', (select count(*) from guests where first_name='Ann'), 0::bigint);
select t.eq('tenant 2 sees no housekeeping rows of tenant 1', (select count(*) from housekeeping_log where room_id=:'r101'), 0::bigint);
select t.eq('tenant 2 sees only own property', (select count(*) from properties), 1::bigint);
reset role;
-- anon sees nothing
select set_config('request.jwt.claim.sub','',false);
set role anon;
select t.eq('anon sees no rooms', (select count(*) from rooms), 0::bigint);
reset role;
\echo ALL SCENARIOS DONE
