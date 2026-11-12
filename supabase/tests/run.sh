#!/usr/bin/env bash
# Applies a Supabase stub + every migration to a fresh scratch database and runs
# the security/integrity tests. Needs a Postgres superuser connection.
#   PGURL=postgresql://postgres:postgres@localhost:5432/postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PGURL="${PGURL:-postgresql://postgres@localhost:5432/postgres}"
DB=waypoint_test
URL="${PGURL%/*}/$DB"

psql "$PGURL" -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB"

for f in tests/00_supabase_stub.sql migrations/*.sql tests/rls_and_rules.sql; do
  echo "== $f"
  psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "All database tests passed."
