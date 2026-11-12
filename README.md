# Waypoint

Property management for independent motels: reservations, walk-ins, a room calendar, rooms, housekeeping, guests,
staff accounts with an audit trail, printable registration cards and invoices, ID photo storage, and daily reports.
English, Hindi and Gujarati. Built with Next.js 16 (App Router), React 19, Tailwind 4 and Supabase (Postgres + Auth + Storage).

> Heads-up for contributors and coding agents: this is Next.js 16, which differs from older versions
> (for example `proxy.ts` instead of `middleware.ts`, and `unstable_retry` in error boundaries).
> Read the matching guide in `node_modules/next/dist/docs/` before changing framework-level code. See `AGENTS.md`.

## Getting started

You need Node 20.9+ (CI uses 22) and a Supabase project.

```bash
npm ci
cp .env.example .env.local   # then fill in your project URL, publishable key and (to manage staff) the secret key
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | everything | Safe to expose. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | everything | Safe to expose; security comes from row level security. |
| `SUPABASE_SERVICE_ROLE_KEY` | adding / managing staff logins | **Secret. Server only.** No `NEXT_PUBLIC_` prefix, never commit it. Without it the app works normally and the Team page explains that adding logins isn't set up. |

`SUPABASE_SERVICE_ROLE_KEY` bypasses row level security, so it is only used inside Server Actions
(`app/(dashboard)/team/actions.ts`) after the caller is authenticated and authorized, and `lib/supabase/admin.ts` is
marked `server-only` so a client component importing it fails the build.

### Database

Apply the migrations in `supabase/migrations/` in order (Supabase SQL editor, or `supabase db push`):

| Migration | What it does |
| --- | --- |
| `001_initial_schema.sql` | Tables, indexes, base row level security |
| `002_property_setup.sql` | `create_property_for_user()` used by the `/setup` screen |
| `003_security_and_integrity.sql` | Locked-down profiles, per-command RLS with roles, no double bookings, reservation rules, trigger-written housekeeping log |
| `004_team_audit_documents.sql` | Staff accounts (`active` flag, always at least one owner), the `activity_log` audit trail, the private `guest-ids` bucket and `guest_documents`, vehicle plate and tax rate |

Then create a user in Supabase Auth, sign in, and finish `/setup`. There is no public sign-up screen; that first user is
the owner, and the owner adds everyone else from **Team**.

Want sample data in your own property? See [`supabase/demo/README.md`](supabase/demo/README.md).
`supabase/seed.sql` is for a throwaway local database only: it creates its own property that no real login can see.

> Migration 003 refuses to run if a room already has overlapping active reservations. It tells you how many;
> cancel or move them and run it again.

## Features worth knowing about

- **Calendar** (`/calendar`): every room for the next two weeks, stays as bars, today highlighted, out-of-order rooms
  hatched. Click a free cell to start a booking with that room and date filled in. A guest still checked in after their
  check-out date is drawn in red so a "free" room isn't double-sold.
- **Team** (`/team`, owners and managers): add staff with their own login, change roles (owners only), reset passwords,
  deactivate and reactivate. New logins get a one-time password shown once to whoever created them; the person must pick
  their own on first sign-in. Deactivated accounts lose all access immediately. A property can never be left without
  an active owner (enforced in the database). Owners and managers also see a **Recent activity** feed: who created,
  checked in, checked out or cancelled a booking, banned a guest, changed a rate, handled an ID photo or changed staff.
- **Registration card and invoice**: print or save as PDF from any booking (`/reservations/<id>/registration`,
  `/invoice`). Browser print hides the app chrome (checked: the registration card prints on one Letter page). The invoice uses the property's tax rate
  (Settings) and is labelled an *estimate* until the guest has checked in. It shows room charges only; payments come with billing.
- **ID photos**: on a guest's page, take or upload a photo of their ID. Photos are re-encoded in the browser (smaller
  upload; this also strips location data), stored in a **private** bucket under `<property>/<guest>/`, shown through
  five-minute signed links, visible to the whole team, deletable by owners and managers, and every add/remove is audited.
  Check your local rules about how long you may keep ID images.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | lint + typecheck + unit tests (CI also runs `build` and the database tests) |
| `npm test` | Vitest unit tests (dates, stats, calendar layout, invoice maths, team rules, locale completeness, ...) |
| `npm run test:db` | Applies all migrations to a scratch Postgres and runs the security tests (see below) |

### Database tests

`supabase/tests/run.sh` builds a throwaway database with a tiny stand-in for Supabase (`auth.uid()`, the `anon` and
`authenticated` roles, the storage tables), applies every migration, then runs adversarial checks as real
row-level-security users: staff promoting themselves to owner, cross-property access, double bookings, banned guests,
out-of-order rooms, illegal status changes, forged housekeeping logs, removing the last owner, deactivated users,
forged audit rows, ID photos in another property's folder, and more. It needs a Postgres superuser:

```bash
PGURL=postgresql://postgres:postgres@localhost:5432/postgres npm run test:db
```

## How it fits together

- **The database is the authority.** The browser talks to Supabase directly with the publishable key, so access
  control and business rules live in Postgres, not in the client:
  - Row level security scopes every row to the user's property; owners/managers can manage rooms, rates, bans and
    deletes, staff handle day-to-day work. Deactivated users resolve to "no property", so every policy stops working for them.
  - An exclusion constraint makes double booking impossible, even with two clerks booking at once.
  - Triggers validate reservations (room and guest belong to the property, no banned guests, no out-of-order
    rooms, valid status transitions), stamp check-in/out times, mark a room dirty on check-out, and write the
    housekeeping log and the audit trail, all in the same transaction as the change.
- **The only privileged code** is the Team Server Actions. Each one re-checks who is calling and whether they may act
  on that specific member (`lib/team/rules.ts`, unit tested), only touches the caller's own property, and validates its input.
- `lib/services/*` are thin Supabase wrappers; `hooks/*` wrap them in TanStack Query (caching, retries, pagination).
- **"Today" is the property's today.** `todayISO(timeZone)` uses the property's IANA time zone, never the
  browser's or the server's clock. Pass it through; don't call `new Date()` for business dates.
- Pure, tested logic lives in `lib/utils/` (`stats`, `calendar`, `invoice`, `activity`, `plate`, `image`, `dates`).
- The signed-in profile and property live in a per-request store (`store/useAppStore.ts`) and the i18n instance is
  per-provider, so nothing is shared between users on the server.
- Translations are in `public/locales/{en,hi,gu}/common.json`. A test fails if a locale is missing a key, drops a
  `{{placeholder}}`, the code uses a key that doesn't exist, or a dynamically built key family (activity messages,
  team errors, ...) is incomplete.

## Known gaps

Not built yet: **billing and payments** (the `folio_items` table exists; the invoice shows room charges only),
rate management, Booking.com / Expedia channel sync, e-mailed staff invitations (logins are created with a one-time
password instead), ID-photo retention rules, and a way to edit a booking's dates or room. Currency is USD and dates
other than the header and calendar use English month names.

## Deploy

Any Node host or Vercel. Set the environment variables above, then apply the migrations to the production database
**before** deploying code that depends on them.
