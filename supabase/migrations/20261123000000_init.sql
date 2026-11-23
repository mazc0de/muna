-- MuNa: initial schema.
-- Domain terms -> code: Barang=item, Toko=store, Belanja=trip, Pembelian=purchase.
-- See HANDOFF.md §3, §4, §7.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  -- composite FK target, so a trip can't point at another user's store
  unique (id, user_id)
);
create unique index stores_user_name_key on public.stores (user_id, lower(name));

create table public.items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index items_user_name_key on public.items (user_id, lower(name));

create table public.trips (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  store_id   uuid not null,
  date       date not null default current_date,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (store_id, user_id) references public.stores (id, user_id) on delete restrict
);
create index trips_user_date_idx on public.trips (user_id, date desc, created_at desc);
create index trips_store_idx on public.trips (store_id);

create table public.purchases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id    uuid not null,
  item_id    uuid not null,
  qty        integer not null check (qty > 0),
  unit_price bigint not null check (unit_price >= 0),
  is_promo   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trip_id, item_id),
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.items (id, user_id) on delete restrict
);
create index purchases_item_idx on public.purchases (item_id);

-- ---------------------------------------------------------------------------
-- RLS: every user only sees and changes their own rows
-- ---------------------------------------------------------------------------

alter table public.stores    enable row level security;
alter table public.items     enable row level security;
alter table public.trips     enable row level security;
alter table public.purchases enable row level security;

create policy "own rows" on public.stores    for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.items     for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.trips     for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.purchases for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.stores, public.items, public.trips, public.purchases from anon;
grant select, insert, update, delete
  on public.stores, public.items, public.trips, public.purchases to authenticated;

-- ---------------------------------------------------------------------------
-- Views (security_invoker = true so the underlying tables' RLS still applies)
-- ---------------------------------------------------------------------------

-- One row per purchase, with the date and store of its trip.
-- "Latest" order: trip date, then trip created_at (§4 #7).
create view public.purchase_details with (security_invoker = true) as
select
  p.id,
  p.user_id,
  p.trip_id,
  p.item_id,
  i.name        as item_name,
  t.store_id,
  s.name        as store_name,
  t.date,
  t.created_at  as trip_created_at,
  p.created_at,
  p.qty,
  p.unit_price,
  p.is_promo
from public.purchases p
join public.trips  t on t.id = p.trip_id
join public.items  i on i.id = p.item_id
join public.stores s on s.id = t.store_id;

-- One row per (item, store). The core of the comparison rules (§4).
create view public.item_store_summary with (security_invoker = true) as
with ranked as (
  select
    pd.*,
    row_number() over (
      partition by pd.item_id, pd.store_id, pd.is_promo
      order by pd.date desc, pd.trip_created_at desc, pd.created_at desc, pd.id desc
    ) as rn
  from public.purchase_details pd
),
per_store as (
  select
    item_id,
    store_id,
    user_id,
    item_name,
    store_name,
    max(unit_price) filter (where not is_promo and rn = 1) as reference_price,
    max(date)       filter (where not is_promo and rn = 1) as reference_date,
    max(unit_price) filter (where is_promo and rn = 1)     as last_promo_price,
    max(date)       filter (where is_promo and rn = 1)     as last_promo_date,
    max(date)                                              as last_purchased_at,
    count(*)                                               as purchase_count
  from ranked
  group by item_id, store_id, user_id, item_name, store_name
),
compared as (
  select
    ps.*,
    count(ps.reference_price) over (partition by ps.item_id) as stores_with_reference,
    min(ps.reference_price)   over (partition by ps.item_id) as cheapest_price
  from per_store ps
)
select
  item_id,
  store_id,
  user_id,
  item_name,
  store_name,
  reference_price,
  reference_date,
  last_promo_price,
  last_promo_date,
  last_purchased_at,
  purchase_count,
  stores_with_reference,
  -- stale: reference price recorded more than 90 days ago
  coalesce(current_date - reference_date > 90, false) as is_stale,
  -- cheapest only means something when >= 2 stores have a reference price (§4 #4, #6)
  coalesce(stores_with_reference >= 2 and reference_price = cheapest_price, false) as is_cheapest,
  case
    when stores_with_reference >= 2 and reference_price is not null
      then reference_price - cheapest_price
  end as diff_from_cheapest
from compared;

-- One row per item, for the items tab.
-- best_*: the cheapest store(s) (more than one on a tie). With nothing to compare
-- against, the store that has a reference price; with no non-promo price at all,
-- the latest purchase (best_is_promo = true).
create view public.item_overview with (security_invoker = true) as
select
  i.id   as item_id,
  i.user_id,
  i.name,
  i.created_at,
  latest.date            as last_purchased_at,
  latest.trip_created_at as last_trip_created_at,
  coalesce(agg.store_count, 0)                 as store_count,
  coalesce(agg.stores_with_reference >= 2, false) as has_comparison,
  case
    when ref.price is not null then ref.store_ids
    when latest.store_id is not null then array[latest.store_id]
  end as best_store_ids,
  case
    when ref.price is not null then ref.store_names
    when latest.store_id is not null then array[latest.store_name]
  end as best_store_names,
  coalesce(ref.price, latest.unit_price)       as best_price,
  ref.price is null and latest.store_id is not null as best_is_promo,
  -- date of the shown price (on a tie: the most recent one)
  coalesce(ref.date, latest.date)              as best_date,
  coalesce(current_date - ref.date > 90, false) as best_is_stale
from public.items i
left join lateral (
  select
    count(*)                    as store_count,
    max(s.stores_with_reference) as stores_with_reference
  from public.item_store_summary s
  where s.item_id = i.id
) agg on true
left join lateral (
  select
    array_agg(s.store_id   order by s.store_name) as store_ids,
    array_agg(s.store_name order by s.store_name) as store_names,
    min(s.reference_price)                        as price,
    max(s.reference_date)                         as date
  from public.item_store_summary s
  where s.item_id = i.id
    and s.reference_price is not null
    and s.reference_price = (
      select min(s2.reference_price) from public.item_store_summary s2 where s2.item_id = i.id
    )
) ref on true
left join lateral (
  select pd.store_id, pd.store_name, pd.unit_price, pd.date, pd.trip_created_at
  from public.purchase_details pd
  where pd.item_id = i.id
  order by pd.date desc, pd.trip_created_at desc, pd.created_at desc, pd.id desc
  limit 1
) latest on true;

-- One row per trip, for the trips tab. Totals are computed, never stored.
create view public.trip_overview with (security_invoker = true) as
select
  t.id,
  t.user_id,
  t.store_id,
  s.name as store_name,
  t.date,
  t.created_at,
  count(p.id)                              as item_count,
  coalesce(sum(p.qty * p.unit_price), 0)::bigint as total
from public.trips t
join public.stores s on s.id = t.store_id
left join public.purchases p on p.trip_id = t.id
group by t.id, s.name;

revoke all on public.purchase_details, public.item_store_summary,
  public.item_overview, public.trip_overview from anon;
grant select on public.purchase_details, public.item_store_summary,
  public.item_overview, public.trip_overview to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: save a trip and its purchases in one transaction
-- ---------------------------------------------------------------------------
-- p_trip_id    null = new trip; set = edit that existing trip.
-- p_store_id   an existing store, or null and pass p_store_name instead
--              (created if missing; matched case-insensitively).
-- p_purchases  jsonb array: [{item_id?, item_name?, qty, unit_price, is_promo}]
--              New items are created from item_name by the same rule.
-- Items no longer in the list are removed from the trip.
-- security invoker (default): RLS still applies.
create function public.save_trip(
  p_trip_id    uuid,
  p_store_id   uuid,
  p_store_name text,
  p_date       date,
  p_purchases  jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_trip_id  uuid := p_trip_id;
  v_store_id uuid := p_store_id;
  v_item_id  uuid;
  v_item_ids uuid[] := '{}';
  v_row      jsonb;
begin
  if p_purchases is null or jsonb_typeof(p_purchases) <> 'array'
     or jsonb_array_length(p_purchases) = 0 then
    raise exception 'A trip needs at least one purchase'
      using errcode = 'P0001';
  end if;

  if v_store_id is null then
    if p_store_name is null or btrim(p_store_name) = '' then
      raise exception 'A store is required' using errcode = 'P0001';
    end if;
    select id into v_store_id from public.stores
     where user_id = auth.uid() and lower(name) = lower(btrim(p_store_name));
    if v_store_id is null then
      insert into public.stores (name) values (btrim(p_store_name))
      returning id into v_store_id;
    end if;
  end if;

  if v_trip_id is null then
    insert into public.trips (store_id, date)
    values (v_store_id, coalesce(p_date, current_date))
    returning id into v_trip_id;
  else
    update public.trips
       set store_id = v_store_id, date = coalesce(p_date, date)
     where id = v_trip_id;
    if not found then
      raise exception 'Trip not found' using errcode = 'P0002';
    end if;
  end if;

  for v_row in select * from jsonb_array_elements(p_purchases) loop
    v_item_id := nullif(v_row ->> 'item_id', '')::uuid;
    if v_item_id is null then
      if coalesce(btrim(v_row ->> 'item_name'), '') = '' then
        raise exception 'An item is required' using errcode = 'P0001';
      end if;
      select id into v_item_id from public.items
       where user_id = auth.uid() and lower(name) = lower(btrim(v_row ->> 'item_name'));
      if v_item_id is null then
        insert into public.items (name) values (btrim(v_row ->> 'item_name'))
        returning id into v_item_id;
      end if;
    end if;

    if v_item_id = any (v_item_ids) then
      raise exception 'The same item appears twice in one trip'
        using errcode = '23505';
    end if;
    v_item_ids := v_item_ids || v_item_id;

    insert into public.purchases (trip_id, item_id, qty, unit_price, is_promo)
    values (
      v_trip_id,
      v_item_id,
      (v_row ->> 'qty')::integer,
      (v_row ->> 'unit_price')::bigint,
      coalesce((v_row ->> 'is_promo')::boolean, false)
    )
    on conflict (trip_id, item_id) do update
      set qty = excluded.qty,
          unit_price = excluded.unit_price,
          is_promo = excluded.is_promo;
  end loop;

  delete from public.purchases
   where trip_id = v_trip_id and item_id <> all (v_item_ids);

  return v_trip_id;
end;
$$;

revoke execute on function public.save_trip(uuid, uuid, text, date, jsonb) from public, anon;
grant execute on function public.save_trip(uuid, uuid, text, date, jsonb) to authenticated;
