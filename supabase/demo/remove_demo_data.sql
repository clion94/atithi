-- Atithi: remove everything add_demo_data.sql created ('[DEMO]' in notes).
-- Rows you created yourself are never touched.
-- Folio items are removed automatically with their reservations (ON DELETE CASCADE).
--
-- If a REAL reservation points at a demo room, the final delete fails and the whole
-- script rolls back. Move or delete that reservation, then run it again.

begin;
  delete from reservations where notes = '[DEMO]';
  delete from guests       where notes = '[DEMO]';
  delete from housekeeping_log
    where room_id in (select id from rooms where notes = '[DEMO]');
  delete from rooms        where notes = '[DEMO]';
commit;
