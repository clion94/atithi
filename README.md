# Waypoint

Property management for independent motels: reservations, walk-ins, rooms, housekeeping, guests and daily reports.
English, Hindi and Gujarati. Built with Next.js 16 (App Router), React 19, Tailwind 4 and Supabase (Postgres + Auth).

> Heads-up for contributors and coding agents: this is Next.js 16, which differs from older versions
> (for example `proxy.ts` instead of `middleware.ts`, and `unstable_retry` in error boundaries).
> Read the matching guide in `node_modules/next/dist/docs/` before changing framework-level code. See `AGENTS.md`.

## Getting started

You need Node 20.9+ (CI uses 22) and a Supabase project.

```bash
npm ci
cp .env.example .env.local   # then fill in your project URL and publishable key
npm run dev
```

Open <http://localhost:3000>.

### Database

Apply the migrations in `supabase/migrations/` in order (Supabase SQL editor, or `supabase db push`):

| Migration | What it does |
| --- | --- |
| `001_initial_schema.sql` | Tables, indexes, base row level security |
| `002_property_setup.sql` | `create_property_for_user()` used by the `/setup` screen |
| `003_security_and_integrity.sql` | Locked-down profiles, per-command RLS with roles, no double bookings, reservation rules, trigger-written housekeeping log |

Then create a user in Supabase Auth, sign in, and finish `/setup`. There is no public sign-up screen.

Want sample data in your own property? See [`supabase/demo/README.md`](supabase/demo/README.md).
`supabase/seed.sql` is for a throwaway local database only: it creates its own property that no real login can see.

> Migration 003 refuses to run if a room already has overlapping active reservations. It tells you how many;
> cancel or move them and run it again.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | lint + typecheck + unit tests (CI also runs `build` and the database tests) |
| `npm test` | Vitest unit tests (dates, stats, search sanitising, locale completeness) |
| `npm run test:db` | Applies all migrations to a scratch Postgres and runs the security tests (see below) |

### Database tests

`supabase/tests/run.sh` builds a throwaway database with a tiny stand-in for Supabase (`auth.uid()`, the `anon` and
`authenticated` roles), applies every migration, then runs adversarial checks as real row-level-security users:
staff promoting themselves to owner, cross-property access, double bookings, banned guests, out-of-order rooms,
illegal status changes, forged housekeeping logs, and more. It needs a Postgres superuser:

```bash
PGURL=postgresql://postgres:postgres@localhost:5432/postgres npm run test:db
```

## How it fits together

- **The database is the authority.** The browser talks to Supabase directly with the publishable key, so access
  control and business rules live in Postgres, not in the client:
  - Row level security scopes every row to the user's property; owners/managers can manage rooms, rates, bans and
    deletes, staff handle day-to-day work.
  - An exclusion constraint makes double booking impossible, even with two clerks booking at once.
  - Triggers validate reservations (room and guest belong to the property, no banned guests, no out-of-order
    rooms, valid status transitions), stamp check-in/out times, mark a room dirty on check-out, and write the
    housekeeping log, all in the same transaction as the change.
- `lib/services/*` are thin Supabase wrappers; `hooks/*` wrap them in TanStack Query (caching, retries, pagination).
- **"Today" is the property's today.** `todayISO(timeZone)` uses the property's IANA time zone, never the
  browser's or the server's clock. Pass it through; don't call `new Date()` for business dates.
- `lib/utils/stats.ts` holds the occupancy, ADR and availability maths as pure, tested functions.
- The signed-in profile and property live in a per-request store (`store/useAppStore.ts`) and the i18n instance is
  per-provider, so nothing is shared between users on the server.
- Translations are in `public/locales/{en,hi,gu}/common.json`. A test fails if a locale is missing a key, drops a
  `{{placeholder}}`, or the code uses a key that doesn't exist.

## Known gaps

Not built yet: billing/folio screens (the `folio_items` table exists), staff invitations (add teammates by
inserting a `profiles` row for now), a room-rack/calendar view, rate management, printable registration cards and
invoices. Currency is USD and dates other than the header use English month names.

## Deploy

Any Node host or Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Both are safe to expose; security comes from row level security.
