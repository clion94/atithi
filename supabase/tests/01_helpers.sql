-- Assertion helpers shared by the test files.
create schema t; grant usage on schema t to authenticated, anon;
create function t.fails(p_sql text, p_expect text) returns void language plpgsql as $$
begin
  begin execute p_sql; exception when others then
    if sqlerrm ilike '%'||p_expect||'%' then raise notice 'PASS (blocked): %', p_expect; return; end if;
    raise exception 'WRONG ERROR for [%]: got [%], expected [%]', p_sql, sqlerrm, p_expect;
  end;
  raise exception 'NOT BLOCKED: %', p_sql;
end $$;
create function t.eq(p_what text, p_actual anyelement, p_expected anyelement) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then raise exception 'FAIL %: got %, expected %', p_what, p_actual, p_expected; end if;
  raise notice 'PASS: %', p_what;
end $$;
grant execute on all functions in schema t to authenticated, anon;

