-- Comparison-rule scenarios (HANDOFF.md §4) + RLS & constraints.
-- Run: pnpm db:test  (supabase test db)
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- ---------------------------------------------------------------------------
-- Setup
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'other@test.local', 'authenticated', 'authenticated');

-- Record one trip with one purchase. days_ago is relative to current_date.
create function pg_temp.buy(
  p_store text, p_item text, p_days_ago int, p_price bigint,
  p_promo boolean default false, p_created_at timestamptz default now()
) returns uuid language plpgsql as $$
declare s uuid; i uuid; t uuid;
begin
  select id into s from public.stores where name = p_store;
  if s is null then insert into public.stores (name) values (p_store) returning id into s; end if;
  select id into i from public.items where name = p_item;
  if i is null then insert into public.items (name) values (p_item) returning id into i; end if;
  insert into public.trips (store_id, date, created_at)
    values (s, current_date - p_days_ago, p_created_at) returning id into t;
  insert into public.purchases (trip_id, item_id, qty, unit_price, is_promo)
    values (t, i, 1, p_price, p_promo);
  return t;
end $$;

create function pg_temp.s(p_item text, p_store text) returns public.item_store_summary
language sql as $$
  select * from public.item_store_summary where item_name = p_item and store_name = p_store
$$;

create function pg_temp.o(p_item text) returns public.item_overview
language sql as $$
  select * from public.item_overview where name = p_item
$$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- ---------------------------------------------------------------------------
-- #1 A 20,000, B 18,000 -> B is cheapest, A is +2,000
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store A', 'S1', 10, 20000);
select pg_temp.buy('Store B', 'S1', 5, 18000);

select is((pg_temp.s('S1', 'Store B')).is_cheapest, true, '#1 B is cheapest');
select is((pg_temp.s('S1', 'Store A')).is_cheapest, false, '#1 A is not cheapest');
select is((pg_temp.s('S1', 'Store A')).diff_from_cheapest, 2000::bigint, '#1 A diff +2,000');
select is((pg_temp.s('S1', 'Store B')).diff_from_cheapest, 0::bigint, '#1 B diff 0');
select is((pg_temp.o('S1')).best_store_names, array['Store B'], '#1 overview: cheapest store is B');
select is((pg_temp.o('S1')).best_price, 18000::bigint, '#1 overview: price 18,000');
select is((pg_temp.o('S1')).has_comparison, true, '#1 overview: has a comparison');

-- ---------------------------------------------------------------------------
-- #2 B's latest is promo 17,000, earlier non-promo 21,000 -> B reference 21,000
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store A', 'S2', 10, 20000);
select pg_temp.buy('Store B', 'S2', 20, 21000);
select pg_temp.buy('Store B', 'S2', 2, 17000, true);

select is((pg_temp.s('S2', 'Store B')).reference_price, 21000::bigint, '#2 B reference price = 21,000');
select is((pg_temp.s('S2', 'Store B')).last_promo_price, 17000::bigint, '#2 B last promo = 17,000');
select is((pg_temp.s('S2', 'Store B')).last_promo_date, current_date - 2, '#2 B last promo date');
select is((pg_temp.s('S2', 'Store A')).is_cheapest, true, '#2 A is cheapest');
select is((pg_temp.s('S2', 'Store B')).is_cheapest, false, '#2 B is not cheapest');
select is((pg_temp.s('S2', 'Store B')).diff_from_cheapest, 1000::bigint, '#2 B diff +1,000');

-- ---------------------------------------------------------------------------
-- #3 C 18,000 from 8 months ago, A 20,000 last week -> C cheapest but stale
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store C', 'S3', 240, 18000);
select pg_temp.buy('Store A', 'S3', 7, 20000);

select is((pg_temp.s('S3', 'Store C')).is_cheapest, true, '#3 C is cheapest (stale data still counts)');
select is((pg_temp.s('S3', 'Store C')).is_stale, true, '#3 C is stale');
select is((pg_temp.s('S3', 'Store A')).is_stale, false, '#3 A is not stale');
select is((pg_temp.o('S3')).best_store_names, array['Store C'], '#3 overview: C is cheapest');
select is((pg_temp.o('S3')).best_date, current_date - 240, '#3 overview: date of the cheapest price');
select is((pg_temp.o('S3')).best_is_stale, true, '#3 overview: cheapest price is stale');

-- 90-day boundary: exactly 90 days is not stale yet, 91 days is.
select pg_temp.buy('Store A', 'S3b', 90, 10000);
select pg_temp.buy('Store B', 'S3b', 91, 10000);
select is((pg_temp.s('S3b', 'Store A')).is_stale, false, '#3 exactly 90 days is not stale');
select is((pg_temp.s('S3b', 'Store B')).is_stale, true, '#3 91 days is stale');

-- ---------------------------------------------------------------------------
-- #4 B has only promo 15,000, A 20,000 -> B has no reference price, no badge
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store B', 'S4', 3, 15000, true);
select pg_temp.buy('Store A', 'S4', 5, 20000);

select is((pg_temp.s('S4', 'Store B')).reference_price, null::bigint, '#4 B has no reference price');
select is((pg_temp.s('S4', 'Store B')).last_promo_price, 15000::bigint, '#4 B last promo 15,000');
select is((pg_temp.s('S4', 'Store B')).is_cheapest, false, '#4 B is not cheapest');
select is((pg_temp.s('S4', 'Store A')).is_cheapest, false, '#4 A has no badge (only 1 store has a reference price)');
select is((pg_temp.s('S4', 'Store A')).diff_from_cheapest, null::bigint, '#4 A has no diff');
select is((pg_temp.o('S4')).has_comparison, false, '#4 overview: nothing to compare against');
select is((pg_temp.o('S4')).best_store_names, array['Store A'], '#4 overview: shows the store with a reference price');
select is((pg_temp.o('S4')).best_price, 20000::bigint, '#4 overview: price 20,000');
select is((pg_temp.o('S4')).best_is_promo, false, '#4 overview: not a promo price');

-- ---------------------------------------------------------------------------
-- #5 A and B both 20,000 -> both cheapest
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store A', 'S5', 4, 20000);
select pg_temp.buy('Store B', 'S5', 3, 20000);
select pg_temp.buy('Store C', 'S5', 2, 25000);

select is((pg_temp.s('S5', 'Store A')).is_cheapest, true, '#5 A is cheapest');
select is((pg_temp.s('S5', 'Store B')).is_cheapest, true, '#5 B is cheapest');
select is((pg_temp.s('S5', 'Store C')).is_cheapest, false, '#5 C is not cheapest');
select is((pg_temp.s('S5', 'Store C')).diff_from_cheapest, 5000::bigint, '#5 C diff +5,000');
select is((pg_temp.o('S5')).best_store_names, array['Store A', 'Store B'], '#5 overview: two cheapest stores');

-- ---------------------------------------------------------------------------
-- #6 Only one store -> no badge
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store A', 'S6', 1, 20000);

select is((pg_temp.s('S6', 'Store A')).is_cheapest, false, '#6 no badge');
select is((pg_temp.s('S6', 'Store A')).stores_with_reference, 1::bigint, '#6 only 1 store');
select is((pg_temp.s('S6', 'Store A')).diff_from_cheapest, null::bigint, '#6 no diff');
select is((pg_temp.o('S6')).has_comparison, false, '#6 overview: nothing to compare against');
select is((pg_temp.o('S6')).best_store_names, array['Store A'], '#6 overview: the only store');
select is((pg_temp.o('S6')).best_price, 20000::bigint, '#6 overview: its price');

-- ---------------------------------------------------------------------------
-- #7 Two trips to the same store on the same date -> created_at breaks the tie
-- (the later-created trip is inserted first, so insert order can't matter)
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store A', 'S7', 3, 19000, false, now());
select pg_temp.buy('Store A', 'S7', 3, 20000, false, now() - interval '1 hour');
select pg_temp.buy('Store B', 'S7', 3, 19500);

select is((pg_temp.s('S7', 'Store A')).reference_price, 19000::bigint, '#7 reference price comes from the last-created trip');
select is((pg_temp.s('S7', 'Store A')).is_cheapest, true, '#7 A is cheapest');

-- Trip date wins over created_at
select pg_temp.buy('Store C', 'S7b', 1, 30000, false, now() - interval '1 day');
select pg_temp.buy('Store C', 'S7b', 5, 25000, false, now());
select is((pg_temp.s('S7b', 'Store C')).reference_price, 30000::bigint, '#7 trip date takes precedence over created_at');

-- ---------------------------------------------------------------------------
-- Item with only promo prices at every store
-- ---------------------------------------------------------------------------
select pg_temp.buy('Store B', 'S8', 3, 15000, true);
select is((pg_temp.o('S8')).best_is_promo, true, 'overview: promo only -> best_is_promo');
select is((pg_temp.o('S8')).best_price, 15000::bigint, 'overview: promo only -> last promo price');

-- ---------------------------------------------------------------------------
-- Items tab order: most recently bought first
-- ---------------------------------------------------------------------------
select is(
  (select name from public.item_overview
    order by last_purchased_at desc nulls last, last_trip_created_at desc nulls last limit 1),
  'S6', 'overview: most recently bought item first');

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------
select throws_ok($$ insert into public.stores (name) values ('store a') $$, '23505', null,
  'store names are unique, case-insensitive');
select throws_ok($$ insert into public.items (name) values ('s1') $$, '23505', null,
  'item names are unique, case-insensitive');
select throws_ok($$ insert into public.items (name) values ('   ') $$, '23514', null,
  'item name cannot be blank');
select throws_ok(
  $$ insert into public.purchases (trip_id, item_id, qty, unit_price)
     select p.trip_id, p.item_id, 2, 1000 from public.purchases p limit 1 $$,
  '23505', null, 'one purchase per item per trip');
select throws_ok(
  $$ insert into public.purchases (trip_id, item_id, qty, unit_price)
     select t.id, (select id from public.items where name = 'S6'), 0, 1000 from public.trips t limit 1 $$,
  '23514', null, 'qty must be > 0');
select throws_ok(
  $$ delete from public.items where name = 'S1' $$, '23503', null,
  'an item in use cannot be deleted');
select throws_ok(
  $$ delete from public.stores where name = 'Store A' $$, '23503', null,
  'a store in use cannot be deleted');

-- ---------------------------------------------------------------------------
-- save_trip + trip_overview
-- ---------------------------------------------------------------------------
create temporary table saved (id uuid) on commit drop;
grant all on saved to authenticated;
insert into saved
select public.save_trip(null, null, 'New Store', current_date, $$[
  {"item_name": "Eggs 1 kg", "qty": 2, "unit_price": 28000, "is_promo": false},
  {"item_name": "s1", "qty": 1, "unit_price": 17500, "is_promo": true}
]$$::jsonb);

select is((select store_name from public.trip_overview where id = (select id from saved)),
  'New Store', 'save_trip creates a new store');
select is((select item_count from public.trip_overview where id = (select id from saved)),
  2::bigint, 'save_trip stores 2 purchases');
select is((select total from public.trip_overview where id = (select id from saved)),
  73500::bigint, 'trip total = sum of qty x unit price');
select is((select count(*) from public.items where lower(name) = 's1'),
  1::bigint, 'save_trip reuses an existing item (case-insensitive)');

-- Edit: drop one row, change the other row's price
select public.save_trip((select id from saved), null, 'new store', current_date, $$[
  {"item_name": "EGGS 1 KG", "qty": 1, "unit_price": 27000, "is_promo": false}
]$$::jsonb);
select is((select item_count from public.trip_overview where id = (select id from saved)),
  1::bigint, 'editing a trip removes dropped purchases');
select is((select total from public.trip_overview where id = (select id from saved)),
  27000::bigint, 'editing a trip updates prices');
select is((select count(*) from public.stores where lower(name) = 'new store'),
  1::bigint, 'editing a trip does not duplicate the store');

select throws_ok($$ select public.save_trip(null, null, 'Store A', current_date, '[
  {"item_name": "S1", "qty": 1, "unit_price": 1},
  {"item_name": "s1", "qty": 1, "unit_price": 2}]'::jsonb) $$,
  '23505', null, 'save_trip rejects a duplicate item in one trip');
select throws_ok($$ select public.save_trip(null, null, 'Store A', current_date, '[]'::jsonb) $$,
  'P0001', null, 'save_trip rejects an empty trip');

-- Deleting a trip deletes its purchases
delete from public.trips where id = (select id from saved);
select is((select count(*) from public.purchases p where p.trip_id = (select id from saved)),
  0::bigint, 'deleting a trip deletes its purchases');

-- ---------------------------------------------------------------------------
-- RLS: another user can't see or use the owner's data
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*) from public.item_overview), 0::bigint, 'RLS: item_overview empty for another user');
select is((select count(*) from public.item_store_summary), 0::bigint, 'RLS: item_store_summary empty for another user');
select is((select count(*) from public.trip_overview), 0::bigint, 'RLS: trip_overview empty for another user');
select is((select count(*) from public.stores), 0::bigint, 'RLS: stores empty for another user');

-- Another user may reuse the same name
select lives_ok($$ insert into public.stores (name) values ('Store A') $$, 'names are unique per user');

reset role;
create temporary table owner_store on commit drop as
  select id from public.stores where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
grant select on owner_store to authenticated;
set local role authenticated;
select throws_ok(
  $$ insert into public.trips (store_id) select id from owner_store $$,
  '23503', null, 'cannot create a trip with another user''s store');

-- anon has no access
set local role anon;
select throws_ok($$ select * from public.item_overview $$, '42501', null, 'anon cannot read views');
select throws_ok($$ select * from public.stores $$, '42501', null, 'anon cannot read tables');

select * from finish();
rollback;
