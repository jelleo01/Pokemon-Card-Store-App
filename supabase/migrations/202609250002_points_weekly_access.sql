-- Run after 202609250001_points_and_auth.sql. Safe to run more than once.
begin;

-- New accounts receive 20 P. Existing accounts get only the missing 10 P,
-- including accounts that have already spent their original welcome credit.
create or replace function public.card_reward_action()
returns trigger language plpgsql security definer set search_path = '' as $$
declare author uuid;
begin
  if TG_TABLE_NAME = 'profiles' then
    perform public.card_credit(new.id, 20, 'welcome', 'welcome');
  elsif TG_TABLE_NAME = 'posts' then
    if new.category::text = 'news' and new.shop_id is not null then
      perform public.card_credit(new.user_id, 3, 'report', 'report:' || new.id);
    end if;
  else
    select user_id into author from public.posts where id = new.post_id;
    -- Reactions to any other user's post count, including questions.
    if author <> new.user_id then
      if TG_TABLE_NAME = 'comments' then
        perform public.card_credit(new.user_id, 1, 'comment', 'comment:' || new.id);
      else
        perform public.card_credit(new.user_id, 1, 'like', 'like:' || new.post_id);
      end if;
    end if;
  end if;
  return new;
end;
$$;
select public.card_credit(user_id, 20 - amount, 'welcome_adjustment', 'welcome_20_adjustment')
  from public.card_point_entries where event_key = 'welcome' and amount < 20;

-- An unlock is shared by all visits to the same place for seven days.
create table if not exists public.card_place_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_key text not null,
  expires_at timestamptz not null,
  primary key(user_id, place_key)
);
alter table public.card_place_unlocks enable row level security;
revoke all on public.card_place_unlocks from public, anon, authenticated;
grant select on public.card_place_unlocks to authenticated;
drop policy if exists card_unlock_read_self on public.card_place_unlocks;
create policy card_unlock_read_self on public.card_place_unlocks
  for select to authenticated using (user_id = (select auth.uid()));
-- Honor purchases made before this upgrade, without extending them on reruns.
insert into public.card_place_unlocks(user_id, place_key, expires_at)
select user_id, place_key, max(created_at) + interval '7 days'
from public.card_place_visits group by user_id, place_key
on conflict (user_id, place_key) do nothing;

-- Resolve database UUIDs and map IDs to one billing key.
create or replace function public.card_place_key(input_key text)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select c.place_key from public.card_place_catalog c where c.place_key = input_key),
    (select c.place_key from public.shops s join public.card_place_catalog c
      on c.name = s.name and c.lat = s.lat and c.lng = s.lng where s.id::text = input_key limit 1),
    (select s.id::text from public.shops s where s.id::text = input_key)
  );
$$;
revoke all on function public.card_place_key(text) from public, anon, authenticated;
-- Migrate UUID purchases to their canonical map ID as well.
insert into public.card_place_unlocks(user_id, place_key, expires_at)
select user_id, public.card_place_key(place_key), max(expires_at)
from public.card_place_unlocks where public.card_place_key(place_key) is not null
 group by user_id, public.card_place_key(place_key)
on conflict on constraint card_place_unlocks_pkey do update set expires_at = greatest(card_place_unlocks.expires_at, excluded.expires_at);

create or replace function public.card_open_place(place_key text, request_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); remaining integer; previous public.card_place_visits;
  canonical text; expiry timestamptz;
begin
  if uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  if request_id is null then raise exception 'INVALID_REQUEST'; end if;
  canonical := public.card_place_key(place_key);
  if canonical is null then raise exception 'PLACE_NOT_FOUND'; end if;
  select balance into remaining from public.card_point_accounts where user_id = uid for update;
  if remaining is null then raise exception 'ACCOUNT_NOT_READY'; end if;
  select * into previous from public.card_place_visits where id = request_id;
  if found then
    if previous.user_id <> uid or public.card_place_key(previous.place_key) <> canonical then
      raise exception 'INVALID_REQUEST';
    end if;
    -- Retry IDs never cause a second charge, including after expiry.
    return remaining;
  end if;
  select expires_at into expiry from public.card_place_unlocks
    where user_id = uid and card_place_unlocks.place_key = canonical;
  if expiry is null or expiry <= now() then
    if remaining < 5 then raise exception 'INSUFFICIENT_POINTS'; end if;
    insert into public.card_point_entries(user_id, amount, reason, event_key)
      values (uid, -5, 'place_open', 'visit:' || request_id);
    update public.card_point_accounts set balance = balance - 5 where user_id = uid returning balance into remaining;
    insert into public.card_place_unlocks(user_id, place_key, expires_at)
      values (uid, canonical, now() + interval '7 days')
      on conflict on constraint card_place_unlocks_pkey do update set expires_at = excluded.expires_at;
  end if;
  insert into public.card_place_visits(id, user_id, place_key) values (request_id, uid, canonical);
  return remaining;
end;
$$;

-- Wrap the original detail RPC with server-side expiry enforcement.
do $$ begin
  if to_regprocedure('public.card_place_details_v1(uuid)') is null then
    alter function public.card_place_details(uuid) rename to card_place_details_v1;
  end if;
end $$;
revoke all on function public.card_place_details_v1(uuid) from public, anon, authenticated;
create or replace function public.card_place_details(visit_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare place text; expiry timestamptz; result jsonb;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select public.card_place_key(place_key) into place from public.card_place_visits
    where id = visit_id and user_id = auth.uid();
  if place is null then raise exception 'PAID_VISIT_REQUIRED'; end if;
  select expires_at into expiry from public.card_place_unlocks where user_id = auth.uid() and place_key = place;
  if expiry is null or expiry <= now() then raise exception 'PLACE_ACCESS_EXPIRED'; end if;
  result := public.card_place_details_v1(visit_id);
  return result || jsonb_build_object('expires_at', expiry);
end;
$$;
revoke all on function public.card_place_details(uuid) from public, anon;
grant execute on function public.card_place_details(uuid) to authenticated;

-- Counts and unlock status are available BEFORE paying. Aggregate on the
-- server so the REST row limit cannot silently undercount busy shops.
create or replace function public.card_place_summaries()
returns table(place_key text, news_count bigint, expires_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  return query
    with counts as (
      select public.card_place_key(s.id::text) as key, count(*) as n
      from public.posts p join public.shops s on s.id = p.shop_id
      where p.category::text = 'news' group by public.card_place_key(s.id::text)
    ), places as (
      select c.place_key as key, c.place_key as canonical from public.card_place_catalog c
      union select s.id::text, public.card_place_key(s.id::text) from public.shops s
    )
    select places.key, coalesce(counts.n, 0), u.expires_at from places
      left join counts on counts.key = places.canonical
      left join public.card_place_unlocks u on u.place_key = places.canonical and u.user_id = auth.uid();
end;
$$;
revoke all on function public.card_place_summaries() from public, anon;
grant execute on function public.card_place_summaries() to authenticated;

-- Return the actual NEW reward from the like transaction. An unlike/re-like
-- cannot masquerade as a new reward in the client.
create or replace function public.card_set_like(target_post uuid, liked boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); existed boolean; reward integer := 0; total integer;
begin
  if uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  if not exists (select 1 from public.posts where id = target_post) then raise exception 'POST_NOT_FOUND'; end if;
  perform 1 from public.card_point_accounts where user_id = uid for update;
  if not found then raise exception 'ACCOUNT_NOT_READY'; end if;
  select exists(select 1 from public.card_point_entries where user_id=uid and event_key='like:' || target_post) into existed;
  if liked then
    insert into public.hearts(user_id, post_id) values(uid, target_post) on conflict do nothing;
    if not existed then
      select coalesce(amount,0) into reward from public.card_point_entries where user_id=uid and event_key='like:' || target_post;
    end if;
  else
    delete from public.hearts where user_id=uid and post_id=target_post;
  end if;
  select count(*)::integer into total from public.hearts where post_id=target_post;
  return jsonb_build_object('liked', liked, 'hearts', total, 'awarded', coalesce(reward,0));
end;
$$;
revoke all on function public.card_set_like(uuid, boolean) from public, anon;
grant execute on function public.card_set_like(uuid, boolean) to authenticated;
-- Private in-app feedback; not an App Store rating/review incentive.
create table if not exists public.card_app_feedback (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  headline text not null check (char_length(btrim(headline)) between 2 and 100 and position(chr(10) in headline) = 0),
  feedback text not null check (char_length(btrim(feedback)) between 5 and 2000),
  created_at timestamptz not null default now()
);
alter table public.card_app_feedback enable row level security;
revoke all on public.card_app_feedback from public, anon, authenticated;
grant select on public.card_app_feedback to authenticated;
drop policy if exists card_feedback_read on public.card_app_feedback;
create policy card_feedback_read on public.card_app_feedback for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin(auth.uid()));

create or replace function public.card_submit_feedback(stars integer, summary text, details text)
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  perform 1 from public.card_point_accounts where user_id = uid for update;
  if not found then raise exception 'ACCOUNT_NOT_READY'; end if;
  insert into public.card_app_feedback(user_id, rating, headline, feedback)
    values(uid, stars, btrim(summary), btrim(details)) on conflict(user_id) do nothing;
  if not found then return 0; end if;
  perform public.card_credit(uid, 15, 'feedback', 'app_feedback');
  return 15;
end;
$$;
revoke all on function public.card_submit_feedback(integer, text, text) from public, anon;
grant execute on function public.card_submit_feedback(integer, text, text) to authenticated;
commit;
