# Demo data for a live property

`../seed.sql` creates its own hard-coded property, which no real login can see
(row-level security only exposes the property linked to your profile). These scripts add
mock data to **your existing property** instead, and can remove it again.

1. Open the Supabase dashboard → SQL Editor.
2. Paste `add_demo_data.sql`, set `v_email` to the email you log in with, and run it.
3. Reload the app. Dates are relative to today, so the dashboard shows arrivals,
   departures and in-house guests right away.
4. When you want it gone, run `remove_demo_data.sql`.

Everything the script adds is tagged `[DEMO]` in its `notes` column, which is how the
removal script finds it. Your own rows are never modified. Running the add script twice
does nothing the second time.

Demo rooms use numbers 101–107, 201–207 and 301–306 (some of the 20 rooms are unbooked).
If your property already has a room with one of those numbers, that room is skipped and
no demo reservations are created for it.
