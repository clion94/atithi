-- Tests for migration 004: team accounts, audit trail, ID documents, invoice fields.
insert into auth.users values
  ('dddddddd-0000-0000-0000-000000000001','owner@team.x'),
  ('dddddddd-0000-0000-0000-000000000002','manager@team.x'),
  ('dddddddd-0000-0000-0000-000000000003','staff@team.x'),
  ('dddddddd-0000-0000-0000-000000000004','other@team.x'),
  ('dddddddd-0000-0000-0000-000000000005','solo@team.x');

set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
select name from create_property_for_user('Team Motel');
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000004',false);
select name from create_property_for_user('Other Motel');
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000005',false);
select name from create_property_for_user('Solo Motel');
reset role;

-- staff are added by the server (service role); simulate with admin SQL
insert into profiles(id, property_id, role, full_name, email)
  select 'dddddddd-0000-0000-0000-000000000002', property_id, 'manager', 'Mia Manager', 'manager@team.x' from profiles where id='dddddddd-0000-0000-0000-000000000001';
insert into profiles(id, property_id, role, full_name, email)
  select 'dddddddd-0000-0000-0000-000000000003', property_id, 'staff', 'Sam Staff', 'staff@team.x' from profiles where id='dddddddd-0000-0000-0000-000000000001';
select property_id as tp from profiles where id='dddddddd-0000-0000-0000-000000000001' \gset
select property_id as op from profiles where id='dddddddd-0000-0000-0000-000000000004' \gset
select t.eq('owner email recorded by create_property_for_user', (select email from profiles where id='dddddddd-0000-0000-0000-000000000001'), 'owner@team.x');

-- ===== team visibility
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000002',false);
select t.eq('manager sees the whole team', (select count(*) from profiles), 3::bigint);
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);
select t.eq('staff only sees their own profile', (select count(*) from profiles), 1::bigint);
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000004',false);
select t.eq('other property sees only itself', (select count(*) from profiles), 1::bigint);
select t.fails($$update profiles set active=true where id='dddddddd-0000-0000-0000-000000000004'$$, 'permission denied');
select t.fails($$update profiles set email='x@y.z' where id=auth.uid()$$, 'permission denied');
reset role;

-- ===== always keep an owner
select t.fails($$update profiles set role='manager' where id='dddddddd-0000-0000-0000-000000000001'$$, 'at least one active owner');
select t.fails($$update profiles set active=false where id='dddddddd-0000-0000-0000-000000000001'$$, 'at least one active owner');
select t.fails($$delete from profiles where id='dddddddd-0000-0000-0000-000000000001'$$, 'at least one active owner');
update profiles set role='owner' where id='dddddddd-0000-0000-0000-000000000002';
update profiles set role='manager' where id='dddddddd-0000-0000-0000-000000000001';
select t.fails($$update profiles set role='staff' where id='dddddddd-0000-0000-0000-000000000002'$$, 'at least one active owner');
update profiles set role='owner' where id='dddddddd-0000-0000-0000-000000000001';
update profiles set role='manager' where id='dddddddd-0000-0000-0000-000000000002';
select t.eq('ownership handover leaves exactly one owner', (select count(*) from profiles where property_id=:'tp' and role='owner'), 1::bigint);
-- deleting a whole property (cascade) is not blocked by the owner guard
delete from properties where name='Solo Motel';
select t.eq('property delete cascades through the last owner', (select count(*) from profiles where id='dddddddd-0000-0000-0000-000000000005'), 0::bigint);

-- ===== deactivation locks a user out immediately
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000002',false);
insert into rooms(property_id,number,base_rate) values (get_my_property_id(),'1',100),(get_my_property_id(),'2',100);
insert into guests(property_id,first_name,last_name) values (get_my_property_id(),'Gina','Guest'),(get_my_property_id(),'Gus','Guest');
reset role;
update profiles set active=false where id='dddddddd-0000-0000-0000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);
select t.eq('deactivated user sees no rooms', (select count(*) from rooms), 0::bigint);
select t.eq('deactivated user can still read their own profile (to be told)', (select active from profiles where id=auth.uid()), false);
select t.fails($$insert into guests(property_id,first_name,last_name) values ((select property_id from profiles where id=auth.uid()),'No','Access')$$, 'row-level security');
reset role;
update profiles set active=true where id='dddddddd-0000-0000-0000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);
select t.eq('reactivated user has access again', (select count(*) from rooms), 2::bigint);
reset role;

-- ===== audit trail
select id as rm1 from rooms where number='1' and property_id=:'tp' \gset
select id as rm2 from rooms where number='2' and property_id=:'tp' \gset
select id as gina from guests where first_name='Gina' \gset
select id as gus from guests where first_name='Gus' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);   -- staff does the front desk
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night) values (get_my_property_id(), :'rm1', :'gina', current_date, current_date+2, 100);
select id as res1 from reservations where room_id=:'rm1' \gset
update reservations set status='checked_in' where id=:'res1';
update reservations set status='checked_out' where id=:'res1';
insert into reservations(property_id,room_id,guest_id,check_in_date,check_out_date,rate_per_night,status) values (get_my_property_id(), :'rm2', :'gus', current_date, current_date+1, 100, 'checked_in');
select t.eq('staff cannot read the activity log', (select count(*) from activity_log), 0::bigint);
select t.fails($$insert into activity_log(property_id,action,entity_type) values (get_my_property_id(),'x','y')$$, 'permission denied');
select t.fails($$select log_activity(get_my_property_id(),'x','y',null)$$, 'permission denied');
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000002',false);   -- manager reads it
update rooms set base_rate=120 where id=:'rm1';
update guests set is_banned=true, ban_reason='noise' where id=:'gina';
select t.eq('created is logged once per booking', (select count(*) from activity_log where action='reservation_created'), 2::bigint);
select t.eq('check-in, check-out are logged for the booking', (select count(*) from activity_log where entity_id=:'res1' and action in ('checked_in','checked_out')), 2::bigint);
select t.eq('a walk-in is logged as created AND checked in', (select count(*) from activity_log where action='checked_in'), 2::bigint);
select t.eq('actor is the staff member who did it', (select count(*) from activity_log where action='checked_out' and actor_id='dddddddd-0000-0000-0000-000000000003'), 1::bigint);
select t.eq('summary carries guest name and room', (select summary->>'guest' || ' / ' || (summary->>'room') from activity_log where action='checked_out'), 'Gina Guest / 1');
select t.eq('rate change is logged with old and new value', (select (summary->>'from') || '>' || (summary->>'to') from activity_log where action='room_rate_changed'), '100.00>120.00');
select t.eq('ban is logged with the reason and the manager', (select summary->>'reason' from activity_log where action='guest_banned' and actor_id='dddddddd-0000-0000-0000-000000000002'), 'noise');
select t.fails($$delete from activity_log$$, 'permission denied');
select t.fails($$update activity_log set action='x'$$, 'permission denied');
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000004',false);
select t.eq('another property cannot see this log', (select count(*) from activity_log), 0::bigint);
reset role;

-- ===== ID documents
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);
insert into guest_documents(property_id, guest_id, storage_path, kind) values (get_my_property_id(), :'gus', :'tp' || '/' || :'gus' || '/front.jpg', 'id_front');
select t.eq('staff can attach an ID photo and is recorded as uploader', (select count(*) from guest_documents where uploaded_by='dddddddd-0000-0000-0000-000000000003'), 1::bigint);
select t.fails(format($$insert into guest_documents(property_id,guest_id,storage_path) values (get_my_property_id(),%L,%L)$$, :'gus', :'op' || '/' || :'gus' || '/x.jpg'), 'guest_documents_path_matches');
select t.fails(format($$insert into guest_documents(property_id,guest_id,storage_path) values (get_my_property_id(),%L,%L)$$, :'gus', :'tp' || '/' || :'gina' || '/x.jpg'), 'guest_documents_path_matches');
select t.fails($$update guest_documents set kind='other'$$, 'permission denied');
delete from guest_documents;
select t.eq('staff cannot delete ID documents', (select count(*) from guest_documents), 1::bigint);
-- storage objects follow the same property folders
insert into storage.objects(bucket_id,name) values ('guest-ids', :'tp' || '/' || :'gus' || '/front.jpg');
select t.fails(format($$insert into storage.objects(bucket_id,name) values ('guest-ids',%L)$$, :'op' || '/x/y.jpg'), 'row-level security');
select t.fails($$insert into storage.objects(bucket_id,name) values ('other-bucket','x/y.jpg')$$, 'violates');
select t.eq('staff can read their own property files only', (select count(*) from storage.objects), 1::bigint);
delete from storage.objects;
select t.eq('staff cannot delete stored ID photos', (select count(*) from storage.objects), 1::bigint);
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000004',false);
select t.eq('another property sees none of these files or rows', (select count(*) from storage.objects) + (select count(*) from guest_documents), 0::bigint);
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000002',false);
with d as (delete from storage.objects returning 1) select t.eq('manager can delete stored ID photos', (select count(*) from d), 1::bigint);
with d as (delete from guest_documents returning 1) select t.eq('manager can delete ID documents', (select count(*) from d), 1::bigint);
select t.eq('document add and remove are audited', (select count(*) from activity_log where action in ('id_document_added','id_document_removed')), 2::bigint);
reset role;
select t.eq('bucket is private, images only, 5 MB', (select public::text || file_size_limit || array_to_string(allowed_mime_types, ',') from storage.buckets where id='guest-ids'), 'false5242880image/jpeg,image/png,image/webp');

-- ===== registration card + invoice fields
set role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000003',false);
select t.fails(format($$update reservations set vehicle_plate=%L where id=%L$$, repeat('X', 21), :'res1'), 'vehicle_plate_check');
update reservations set vehicle_plate='TX-1234' where id=:'res1';   -- (checked out already: plate edits are still allowed)
select t.eq('staff can record a plate', (select vehicle_plate from reservations where id=:'res1'), 'TX-1234');
with u as (update properties set tax_rate=9 returning 1) select t.eq('staff cannot change the tax rate', (select count(*) from u), 0::bigint);
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000002',false);
with u as (update properties set tax_rate=8.25 returning 1) select t.eq('manager can set the tax rate', (select count(*) from u), 1::bigint);
select t.fails($$update properties set tax_rate=101$$, 'tax_rate_check');
select t.fails($$update properties set tax_rate=-1$$, 'tax_rate_check');
reset role;
\echo TEAM/AUDIT/DOCUMENT SCENARIOS DONE
