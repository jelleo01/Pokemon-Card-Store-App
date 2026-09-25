-- Run after schema.sql (and admin.sql, when used).
-- This is a new, isolated points system. Existing point_transactions records
-- are preserved; the application uses only card_point_* going forward.
begin;

create table if not exists public.card_point_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0)
);
create table if not exists public.card_point_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  event_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, event_key)
);
create table if not exists public.card_place_catalog (
  place_key text primary key,
  name text not null,
  addr text not null,
  lat double precision not null,
  lng double precision not null,
  type text not null,
  hours text not null default ''
);
create table if not exists public.card_place_visits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_key text not null,
  created_at timestamptz not null default now()
);
alter table public.card_point_accounts enable row level security;
alter table public.card_point_entries enable row level security;
alter table public.card_place_catalog enable row level security;
alter table public.card_place_visits enable row level security;
revoke all on public.card_point_accounts, public.card_point_entries,
  public.card_place_catalog, public.card_place_visits from public, anon, authenticated;
grant select on public.card_point_accounts, public.card_point_entries to authenticated;
drop policy if exists card_points_read_self on public.card_point_accounts;
create policy card_points_read_self on public.card_point_accounts
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists card_entries_read_self on public.card_point_entries;
create policy card_entries_read_self on public.card_point_entries
  for select to authenticated using (user_id = (select auth.uid()));

-- Internal helper: never callable by an API client. Rewards and the action
-- which earned them commit or roll back together.
create or replace function public.card_credit(uid uuid, qty integer, why text, event text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.card_point_accounts(user_id) values (uid) on conflict do nothing;
  insert into public.card_point_entries(user_id, amount, reason, event_key)
    values (uid, qty, why, event) on conflict (user_id, event_key) do nothing;
  if found then
    update public.card_point_accounts set balance = balance + qty where user_id = uid;
  end if;
end;
$$;
revoke all on function public.card_credit(uuid, integer, text, text) from public, anon, authenticated;

create or replace function public.card_reward_action()
returns trigger language plpgsql security definer set search_path = '' as $$
declare author uuid; kind text;
begin
  if TG_TABLE_NAME = 'profiles' then
    perform public.card_credit(new.id, 10, 'welcome', 'welcome');
  elsif TG_TABLE_NAME = 'posts' then
    if new.category::text = 'news' and new.shop_id is not null then
      perform public.card_credit(new.user_id, 3, 'report', 'report:' || new.id);
    end if;
  else
    select user_id, category::text into author, kind from public.posts where id = new.post_id;
    if author <> new.user_id and kind = 'news' then
      if TG_TABLE_NAME = 'comments' then
        perform public.card_credit(new.user_id, 1, 'comment', 'comment:' || new.id);
      else
        -- A deleted/re-created like must not award again.
        perform public.card_credit(new.user_id, 1, 'like', 'like:' || new.post_id);
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.card_reward_action() from public, anon, authenticated;
drop trigger if exists card_profile_reward on public.profiles;
create trigger card_profile_reward after insert on public.profiles
  for each row execute function public.card_reward_action();
drop trigger if exists card_post_reward on public.posts;
create trigger card_post_reward after insert on public.posts
  for each row execute function public.card_reward_action();
drop trigger if exists card_comment_reward on public.comments;
create trigger card_comment_reward after insert on public.comments
  for each row execute function public.card_reward_action();
drop trigger if exists card_like_reward on public.hearts;
create trigger card_like_reward after insert on public.hearts
  for each row execute function public.card_reward_action();
-- Existing members receive the same one-time starting balance. Re-running
-- the migration does not add another welcome bonus or reward old activity.
select public.card_credit(id, 10, 'welcome', 'welcome') from public.profiles;


-- Reactions on someone else's report must be able to update cached counts.
create or replace function public.bump_post_hearts()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set hearts_count = coalesce(hearts_count, 0) + 1 where id = new.post_id;
  else
    update public.posts set hearts_count = greatest(0, hearts_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;
create or replace function public.bump_post_comments()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = coalesce(comments_count, 0) + 1 where id = new.post_id;
  else
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;
revoke all on function public.bump_post_hearts(), public.bump_post_comments() from public, anon, authenticated;

-- All app data requires authentication, even via a direct REST request.
-- Restrictive policies also apply when older permissive policies exist.
do $$
declare tbl text;
begin
  foreach tbl in array array['profiles','shops','posts','comments','hearts',
    'shop_confirms','reports','admins','notices','inquiries','blocks'] loop
    if to_regclass('public.' || tbl) is not null then
      execute format('alter table public.%I enable row level security', tbl);
      execute format('drop policy if exists card_require_login on public.%I', tbl);
      execute format('create policy card_require_login on public.%I as restrictive for all to public using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null)', tbl);
    end if;
  end loop;
end;
$$;

create or replace function public.card_open_place(place_key text, request_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); remaining integer; previous public.card_place_visits;
begin
  if uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  if request_id is null then raise exception 'INVALID_REQUEST'; end if;
  if not exists (select 1 from public.card_place_catalog c where c.place_key = card_open_place.place_key)
    and not exists (select 1 from public.shops s where s.id::text = card_open_place.place_key) then
    raise exception 'PLACE_NOT_FOUND';
  end if;
  -- Serialize spends for this account, including concurrent browser tabs.
  select balance into remaining from public.card_point_accounts where user_id = uid for update;
  if remaining is null then raise exception 'ACCOUNT_NOT_READY'; end if;
  select * into previous from public.card_place_visits where id = request_id;
  if found then
    if previous.user_id <> uid or previous.place_key <> card_open_place.place_key then
      raise exception 'INVALID_REQUEST';
    end if;
    return remaining;
  end if;
  if remaining < 5 then raise exception 'INSUFFICIENT_POINTS'; end if;
  insert into public.card_place_visits(id, user_id, place_key) values (request_id, uid, place_key);
  insert into public.card_point_entries(user_id, amount, reason, event_key)
    values (uid, -5, 'place_open', 'visit:' || request_id);
  update public.card_point_accounts set balance = balance - 5 where user_id = uid returning balance into remaining;
  return remaining;
end;
$$;
revoke all on function public.card_open_place(text, uuid) from public, anon;
grant execute on function public.card_open_place(text, uuid) to authenticated;

-- Only a paid visit belonging to the signed-in user can load this detail view.
-- Basic map metadata and individual community reports remain available to
-- signed-in members so they can find places and contribute to earn points.
create or replace function public.card_place_details(visit_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare place text; details jsonb; stories jsonb;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select place_key into place from public.card_place_visits where id = visit_id and user_id = auth.uid();
  if place is null then raise exception 'PAID_VISIT_REQUIRED'; end if;
  select to_jsonb(c) into details from public.card_place_catalog c where c.place_key = place;
  if details is null then
    select jsonb_build_object('place_key', s.id, 'name', s.name, 'addr', s.addr,
      'lat', s.lat, 'lng', s.lng, 'type', s.type, 'hours', s.hours)
      into details from public.shops s where s.id::text = place;
  end if;
  if details is null then raise exception 'PLACE_NOT_FOUND'; end if;
  select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) into stories from (
    select p.created_at, jsonb_build_object('id', p.id, 'body', p.body, 'category', p.category,
      'hearts_count', p.hearts_count, 'comments_count', p.comments_count,
      'created_at', p.created_at, 'who', pr.trainer_id) as row_data
    from public.posts p join public.shops s on s.id = p.shop_id
    join public.profiles pr on pr.id = p.user_id
    where s.id::text = place or (s.name = details->>'name'
      and s.lat = (details->>'lat')::double precision and s.lng = (details->>'lng')::double precision)
    order by p.created_at desc limit 100
  ) recent;
  return jsonb_build_object('place', details, 'posts', stories);
end;
$$;
revoke all on function public.card_place_details(uuid) from public, anon;
grant execute on function public.card_place_details(uuid) to authenticated;

-- Canonical IDs matching the checked-in map catalogue.
insert into public.card_place_catalog(place_key, name, addr, lat, lng, type, hours) values
('PC-0001', '포켓몬 카드샵 아이파크몰 용산점', '서울 용산구 한강대로23길 55', '37.5288302007672', '126.964561046824', '공식', '문의'),
('PC-0002', '포켓몬카드샵 카드스페이스 원주', '강원특별자치도 원주시 능라동길 42', '37.3338274912607', '127.929239254845', '공식', '문의'),
('PC-0003', '포켓몬카드샵 화성스토어TCG 광주', '광주 동구 중앙로160번길 22', '35.1469743582681', '126.915098713627', '공식', '문의'),
('PC-0004', '트레이너스쿨', '대구 달서구 야외음악당로 50', '35.8416978566893', '128.553045781474', '공식', '문의'),
('PC-0005', '포켓몬카드샵 카드베이스 부산', '부산 동래구 명륜로129번길 54', '35.20539921527362', '129.07934720765246', '공식', '문의'),
('PC-0006', 'CGV 구로점', '서울특별시 구로구 구로중앙로 152', '37.50147', '126.882261', '자판기', '영화관 운영시간'),
('PC-0007', 'CGV 등촌점', '서울특별시 강서구 공항대로45길 63', '37.557974', '126.855998', '자판기', '영화관 운영시간'),
('PC-0008', 'CGV 천호점', '서울특별시 강동구 양재대로 1571', '37.545896', '127.142222', '자판기', '영화관 운영시간'),
('PC-0009', 'CGV 방학점', '서울특별시 도봉구 도봉로 684 8층', '37.665398', '127.043514', '자판기', '영화관 운영시간'),
('PC-0010', 'CGV 고양백석점', '경기도 고양시 일산동구 중앙로 1036 고양종합터미널', '37.643525', '126.790451', '자판기', '영화관 운영시간'),
('PC-0011', 'CGV 김포운양점', '경기도 김포시 운양동 김포한강11로 288-31', '37.654645', '126.684031', '자판기', '영화관 운영시간'),
('PC-0012', 'CGV 김포점', '경기도 김포시 풍무동 풍무로 128', '37.607016', '126.723227', '자판기', '영화관 운영시간'),
('PC-0013', 'CGV 동탄역점', '경기도 화성시 동탄구 동탄대로 537', '37.202285', '127.098147', '자판기', '영화관 운영시간'),
('PC-0014', 'CGV 동탄호수공원점', '경기도 화성시 동탄대로 181', '37.171104', '127.104922', '자판기', '영화관 운영시간'),
('PC-0015', 'CGV 소풍점', '경기도 부천시 송내대로 239', '37.504098', '126.756754', '자판기', '영화관 운영시간'),
('PC-0016', 'CGV 야탑점', '경기도 성남시 분당구 성남대로925번길 16 테마폴리스 지하 2층', '37.413329', '127.12761', '자판기', '영화관 운영시간'),
('PC-0017', 'CGV 양주옥정점', '경기도 양주시 옥정로 200', '37.819482', '127.092096', '자판기', '영화관 운영시간'),
('PC-0018', 'CGV 오리점', '경기도 성남시 분당구 탄천상로151번길 20 CGV스퀘어 4층', '37.340803', '127.106729', '자판기', '영화관 운영시간'),
('PC-0019', 'CGV 의정부점', '경기도 의정부시 평화로 525', '37.737732', '127.045683', '자판기', '영화관 운영시간'),
('PC-0020', 'CGV 일산점', '경기도 고양시 일산동구 정발산로 24', '37.655285', '126.772354', '자판기', '영화관 운영시간'),
('PC-0021', 'CGV 파주문산점', '경기도 파주시 문산읍 방촌로 1719-10', '37.866771', '126.784117', '자판기', '영화관 운영시간'),
('PC-0022', 'CGV 판교점', '경기도 성남시 분당구 판교역로146번길 20 까르띠에 현대백화점 판교점 5층', '37.392824', '127.112158', '자판기', '영화관 운영시간'),
('PC-0023', 'CGV 배곧점', '경기도 시흥시 서울대학로278번길 61 7층', '37.368573', '126.730846', '자판기', '영화관 운영시간'),
('PC-0024', 'CGV 스타필드시티위례점', '경기도 하남시 위례대로 200', '37.480171', '127.148231', '자판기', '영화관 운영시간'),
('PC-0025', 'CGV 인천연수점', '인천광역시 연수구 동춘동 청능대로 210', '37.406365', '126.68336', '자판기', '영화관 운영시간'),
('PC-0026', 'CGV 인천점', '인천광역시 남동구 예술로 198', '37.451998', '126.701866', '자판기', '영화관 운영시간'),
('PC-0027', 'CGV 인천학익점', '인천광역시 미추홀구 매소홀로 255', '37.445683', '126.651762', '자판기', '영화관 운영시간'),
('PC-0028', 'CGV 계양점', '인천광역시 계양구 장제로 738 메트로몰 8층', '37.533767', '126.734587', '자판기', '영화관 운영시간'),
('PC-0029', 'CGV 강릉점', '강원특별자치도 강릉시 경강로 2120', '37.755725', '128.898681', '자판기', '영화관 운영시간'),
('PC-0030', 'CGV 춘천점', '강원특별자치도 춘천시 지석로 80', '37.850634', '127.743684', '자판기', '영화관 운영시간'),
('PC-0031', 'CGV 천안터미널점', '충청남도 천안시 동남구 만남로 43 B관 5층', '36.819443', '127.155671', '자판기', '영화관 운영시간'),
('PC-0032', 'CGV 천안펜타포트점', '충청남도 천안시 서북구 공원로 196', '36.798596', '127.101007', '자판기', '영화관 운영시간'),
('PC-0033', 'CGV 청주(서문)점', '충청북도 청주시 상당구 상당로81번길 63', '36.635069', '127.486923', '자판기', '영화관 운영시간'),
('PC-0034', 'CGV 청주지웰시티점', '충청북도 청주시 흥덕구 복대동 3381', '36.64315', '127.429172', '자판기', '영화관 운영시간'),
('PC-0035', 'CGV 대전가오점', '대전광역시 동구 은어송로 72', '36.306998', '127.45802', '자판기', '영화관 운영시간'),
('PC-0036', 'CGV 대전점', '대전광역시 중구 계백로 1700 6 세이백화점 7층', '36.321016', '127.409022', '자판기', '영화관 운영시간'),
('PC-0037', 'CGV 대전터미널점', '대전광역시 동구 동서대로1695번길 30', '36.351306', '127.437558', '자판기', '영화관 운영시간'),
('PC-0038', 'CGV 세종점', '세종특별자치시 도움1로 108', '36.502677', '127.24764', '자판기', '영화관 운영시간'),
('PC-0039', 'CGV 대구스타디움점', '대구광역시 수성구 유니버시아드로 140', '35.832234', '128.686669', '자판기', '영화관 운영시간'),
('PC-0040', 'CGV 대구월성점', '대구광역시 달서구 조암로 29', '35.824654', '128.527115', '자판기', '영화관 운영시간'),
('PC-0041', 'CGV 동래점', '부산광역시 동래구 중앙대로 1523', '35.221889', '129.085305', '자판기', '영화관 운영시간'),
('PC-0042', 'CGV 아시아드점', '부산광역시 연제구 종합운동장로 7', '35.191147', '129.064155', '자판기', '영화관 운영시간'),
('PC-0043', 'CGV 센텀시티점', '부산광역시 해운대구 센텀남대로 35 신세계센텀시티 7F', '35.168791', '129.129704', '자판기', '영화관 운영시간'),
('PC-0044', 'CGV 거제점', '경상남도 거제시 장평로 12', '34.891206', '128.616556', '자판기', '영화관 운영시간'),
('PC-0045', 'CGV 김해점', '경상남도 김해시 내외중앙로 137', '35.242243', '128.868609', '자판기', '영화관 운영시간'),
('PC-0046', 'CGV 광주첨단점', '광주광역시 광산구 임방울대로826번길 29-31', '35.216452', '126.85031', '자판기', '영화관 운영시간'),
('PC-0047', 'CGV 광주하남점', '광주광역시 광산구 용아로400번길 30 테라스56피크닉몰 2층', '35.178249', '126.806447', '자판기', '영화관 운영시간'),
('PC-0048', 'CGV 광주상무점', '광주광역시 서구 치평동 시청로 67', '35.15436', '126.851114', '자판기', '영화관 운영시간'),
('PC-0049', 'CGV 서전주점', '전북특별자치도 전주시 완산구 홍산로 260', '35.816787', '127.10641', '자판기', '영화관 운영시간'),
('PC-0050', 'CGV 전주고사점', '전북특별자치도 전주시 완산구 전주객사3길 72', '35.820452', '127.142043', '자판기', '영화관 운영시간'),
('PC-0051', 'CGV 전주효자점', '전북특별자치도 전주시 완산구 용머리로 45', '35.806906', '127.115738', '자판기', '영화관 운영시간'),
('PC-0052', 'CGV 순천신대점', '전라남도 순천시 해광로 199', '34.926134', '127.552279', '자판기', '영화관 운영시간'),
('PC-0053', '메가박스 강남점', '서울특별시 서초구 서초대로77길 3 아라타워', '37.497976', '127.026537', '자판기', '영화관 운영시간'),
('PC-0054', '메가박스 마곡점', '서울특별시 강서구 공항대로 247', '37.559273', '126.834949', '자판기', '영화관 운영시간'),
('PC-0055', '메가박스 상암월드컵경기장점', '서울특별시 마포구 월드컵로 240', '37.569264', '126.898345', '자판기', '영화관 운영시간'),
('PC-0056', '메가박스 센트럴점', '서울특별시 서초구 신반포로 176', '37.504432', '127.003546', '자판기', '영화관 운영시간'),
('PC-0057', '메가박스 이수점', '서울특별시 동작구 동작대로 89', '37.484711', '126.981611', '자판기', '영화관 운영시간'),
('PC-0058', '메가박스 코엑스점', '서울특별시 강남구 봉은사로 524', '37.512751', '127.058674', '자판기', '영화관 운영시간'),
('PC-0059', '메가박스 화곡점', '서울특별시 강서구 화곡로 142', '37.540613', '126.83759', '자판기', '영화관 운영시간'),
('PC-0060', '메가박스 수원AK플라자점', '경기도 수원시 팔달구 덕영대로 924', '37.266626', '126.999935', '자판기', '영화관 운영시간'),
('PC-0061', '메가박스 고양스타필드점', '경기도 고양시 덕양구 고양대로 1955', '37.646805', '126.892526', '자판기', '영화관 운영시간'),
('PC-0062', '메가박스 김포한강신도시점', '경기도 김포시 구래동 한강9로75번길 180', '37.64485', '126.624294', '자판기', '영화관 운영시간'),
('PC-0063', '메가박스 남양주현대아울렛스페이스원점', '경기도 남양주시 다산순환로 50 현대프리미엄 아울렛 스페이스원 3층', '37.616215', '127.152503', '자판기', '영화관 운영시간'),
('PC-0064', '메가박스 부천스타필드시티점', '경기도 부천시 소사구 옥길로 1', '37.461732', '126.813819', '자판기', '영화관 운영시간'),
('PC-0065', '메가박스 안성스타필드점', '경기도 안성시 공도읍 서동대로 3930-39', '36.994687', '127.145723', '자판기', '영화관 운영시간'),
('PC-0066', '메가박스 킨텍스점', '경기도 고양시 일산서구 호수로 817 레이킨스몰 3층', '37.668005', '126.751743', '자판기', '영화관 운영시간'),
('PC-0067', '메가박스 하남스타필드점', '경기도 하남시 미사대로 750', '37.545544', '127.223708', '자판기', '영화관 운영시간'),
('PC-0068', '메가박스 송도점', '인천광역시 연수구 D동 송도과학로16번길 33-4 2~4층 트리플스트리트', '37.378685', '126.662839', '자판기', '영화관 운영시간'),
('PC-0069', '메가박스 대전중앙로점', '대전광역시 중구 중앙로 126', '36.327667', '127.424059', '자판기', '영화관 운영시간'),
('PC-0070', '메가박스 대전현대아울렛점', '대전광역시 유성구 테크노중앙로 123', '36.424021', '127.398658', '자판기', '영화관 운영시간'),
('PC-0071', '메가박스 세종나성점', '세종특별자치시 나성로 38', '36.483581', '127.263804', '자판기', '영화관 운영시간'),
('PC-0072', '롯데시네마 건대입구점', '서울특별시 광진구 아차산로 262', '37.538539', '127.073215', '자판기', '영화관 운영시간'),
('PC-0073', '롯데시네마 김포공항점', '서울특별시 강서구 하늘길 77', '37.56381', '126.803746', '자판기', '영화관 운영시간'),
('PC-0074', '롯데시네마 노원점', '서울특별시 노원구 동일로 1414 롯데백화점 노원점 10층', '37.654871', '127.061155', '자판기', '영화관 운영시간'),
('PC-0075', '롯데시네마 신대방점', '서울특별시 동작구 시흥대로 606', '37.486479', '126.905151', '자판기', '영화관 운영시간'),
('PC-0076', '롯데시네마 신림점', '서울특별시 관악구 신림로 330', '37.484003', '126.930287', '자판기', '영화관 운영시간'),
('PC-0077', '롯데시네마 월드타워점', '서울특별시 송파구 올림픽로 300', '37.513998', '127.104864', '자판기', '영화관 운영시간'),
('PC-0078', '롯데시네마 은평점', '서울특별시 은평구 통일로 1050', '37.636774', '126.917909', '자판기', '영화관 운영시간'),
('PC-0079', '롯데시네마 청량리점', '서울특별시 동대문구 왕산로 214', '37.580688', '127.048712', '자판기', '영화관 운영시간'),
('PC-0080', '롯데시네마 광명아울렛점', '경기도 광명시 일직로 17', '37.424795', '126.884286', '자판기', '영화관 운영시간'),
('PC-0081', '롯데시네마 구리아울렛점', '경기도 구리시 동구릉로136번길 47', '37.611902', '127.140657', '자판기', '영화관 운영시간'),
('PC-0082', '롯데시네마 동탄점', '경기도 화성시 동탄역로 160', '37.200487', '127.097963', '자판기', '영화관 운영시간'),
('PC-0083', '롯데시네마 별내점', '경기도 남양주시 별내중앙로 10', '37.644652', '127.127602', '자판기', '영화관 운영시간'),
('PC-0084', '롯데시네마 산본피트인점', '경기도 군포시 번영로 485', '37.357896', '126.930457', '자판기', '영화관 운영시간'),
('PC-0085', '롯데시네마 성남중앙점', '경기도 성남시 수정구 산성대로 267', '37.441299', '127.146401', '자판기', '영화관 운영시간'),
('PC-0086', '롯데시네마 수원점', '경기도 수원시 권선구 세화로 134', '37.264451', '126.997303', '자판기', '영화관 운영시간'),
('PC-0087', '롯데시네마 수지점', '경기도 용인시 수지구 성복2로 38', '37.312647', '127.081806', '자판기', '영화관 운영시간'),
('PC-0088', '롯데시네마 안산점', '경기도 안산시 상록구 항가울로 422 롯데마트 안산점 4층', '37.318311', '126.846263', '자판기', '영화관 운영시간'),
('PC-0089', '롯데시네마 용인기흥점', '경기도 용인시 기흥구 기흥역로 63', '37.274613', '127.116636', '자판기', '영화관 운영시간'),
('PC-0090', '롯데시네마 의정부민락점', '경기도 의정부시 천보로 44', '37.744311', '127.096295', '자판기', '영화관 운영시간'),
('PC-0091', '롯데시네마 파주운정점', '경기도 파주시 목동동 청암로17번길 17', '37.729567', '126.736601', '자판기', '영화관 운영시간'),
('PC-0092', '롯데시네마 평촌점', '경기도 안양시 동안구 시민대로 180', '37.390226', '126.950611', '자판기', '영화관 운영시간'),
('PC-0093', '롯데시네마 부평점', '인천광역시 부평구 대정로 66', '37.493637', '126.726567', '자판기', '영화관 운영시간'),
('PC-0094', '롯데시네마 인천아시아드점', '인천광역시 서구 봉수대로 806', '37.546345', '126.666462', '자판기', '영화관 운영시간'),
('PC-0095', '롯데시네마 원주무실점', '강원특별자치도 원주시 능라동길 51', '37.334951', '127.929998', '자판기', '영화관 운영시간'),
('PC-0096', '롯데시네마 제주연동점', '제주특별자치도 제주시 과원로 128 B1F', '33.48086', '126.494694', '자판기', '영화관 운영시간'),
('PC-0097', '롯데시네마 아산터미널점', '충청남도 아산시 번영로 225', '36.784929', '127.015906', '자판기', '영화관 운영시간'),
('PC-0098', '롯데시네마 서청주점', '충청북도 청주시 흥덕구 비하동 순환로 1004', '36.644949', '127.421249', '자판기', '영화관 운영시간'),
('PC-0099', '롯데시네마 대전관저점', '대전광역시 서구 봉우로8번길 23', '36.302404', '127.333762', '자판기', '영화관 운영시간'),
('PC-0100', '롯데시네마 대구상인점', '대구광역시 달서구 월곡로 247', '35.816491', '128.539222', '자판기', '영화관 운영시간'),
('PC-0101', '롯데시네마 대구율하점', '대구광역시 동구 안심로 80', '35.867873', '128.694075', '자판기', '영화관 운영시간'),
('PC-0102', '롯데시네마 울산점', '울산광역시 남구 삼산로 282 롯데백화점 영플라자 3층', '35.538256', '129.338149', '자판기', '영화관 운영시간'),
('PC-0103', '롯데시네마 광복점', '부산광역시 중구 중앙대로 2 롯데백화점 아쿠아몰 9F', '35.098064', '129.036071', '자판기', '영화관 운영시간'),
('PC-0104', '롯데시네마 동래점', '부산광역시 동래구 중앙대로 1393', '35.211535', '129.077648', '자판기', '영화관 운영시간'),
('PC-0105', '롯데시네마 동부산점', '부산광역시 기장군 기장해안로 147 롯데몰 3층', '35.192329', '129.212936', '자판기', '영화관 운영시간'),
('PC-0106', '롯데시네마 부산본점', '부산광역시 부산진구 가야대로 772 롯데백화점부산본점 10F', '35.156905', '129.056679', '자판기', '영화관 운영시간'),
('PC-0107', '롯데시네마 진주혁신점', '경상남도 진주시 충무 공동 35', '35.18056', '128.140214', '자판기', '영화관 운영시간'),
('PC-0108', '롯데시네마 광주수완점', '광주광역시 광산구 장신로 98', '35.190367', '126.820163', '자판기', '영화관 운영시간'),
('PC-0109', '롯데시네마 군산몰점', '전북특별자치도 군산시 조촌로 130 롯데몰 군산점 4F', '35.976561', '126.73863', '자판기', '영화관 운영시간'),
('PC-0110', '롯데시네마 전주점', '전북특별자치도 전주시 완산구 온고을로 2', '35.83462', '127.121958', '자판기', '영화관 운영시간'),
('PC-0111', '롯데마트 김포공항점', '서울특별시 강서구 하늘길 38', '37.563391', '126.803137', '자판기', '마트 운영시간'),
('PC-0112', '롯데마트 양평점', '경기도 양평군 양평읍 남북로 76', '37.489648', '127.502575', '자판기', '마트 운영시간'),
('PC-0113', '롯데마트 월드타워점', '서울특별시 송파구 올림픽로 300', '37.514164', '127.10482', '자판기', '마트 운영시간'),
('PC-0114', '롯데마트 은평점', '서울특별시 은평구 통일로 1050', '37.638256', '126.917858', '자판기', '마트 운영시간'),
('PC-0115', '롯데마트 제타플렉스점', '서울특별시 송파구 올림픽로 240', '37.511646', '127.096254', '자판기', '마트 운영시간'),
('PC-0116', '롯데마트 중계점', '서울특별시 노원구 노원로 330', '37.646814', '127.07102', '자판기', '마트 운영시간'),
('PC-0117', '롯데마트 청량리점', '서울특별시 동대문구 왕산로 214', '37.580537', '127.048556', '자판기', '마트 운영시간'),
('PC-0118', '롯데마트 광교점', '경기도 수원시 영통구 센트럴타운로22번길 85', '37.290315', '127.049705', '자판기', '마트 운영시간'),
('PC-0119', '롯데마트 김포한강점', '경기도 김포시 장기동 김포한강2로 41', '37.640573', '126.677481', '자판기', '마트 운영시간'),
('PC-0120', '롯데마트 신갈점', '경기 용인시 기흥구 중부대로 375 기흥역롯데캐슬스카이', '37.272465', '127.10891', '자판기', '마트 운영시간'),
('PC-0121', '롯데마트 수원몰점', '경기도 수원시 권선구 세화로 134', '37.263578', '126.996088', '자판기', '마트 운영시간'),
('PC-0122', '롯데마트 수지몰점', '경기도 용인시 수지구 성복2로 38', '37.312304', '127.082252', '자판기', '마트 운영시간'),
('PC-0123', '롯데마트 안산점', '경기도 안산시 상록구 항가울로 422', '37.318015', '126.846208', '자판기', '마트 운영시간'),
('PC-0124', '롯데마트 덕소점', '경기도 남양주시 와부읍 월문천로 33', '37.584765', '127.214607', '자판기', '마트 운영시간'),
('PC-0125', '롯데마트 판교점', '경기도 성남시 분당구 대왕판교로606번길 58', '37.395611', '127.11333', '자판기', '마트 운영시간'),
('PC-0126', '롯데마트 삼산점', '인천광역시 부평구 길주로 623', '37.508063', '126.732067', '자판기', '마트 운영시간'),
('PC-0127', '롯데마트 송도점', '인천광역시 연수구 컨벤시아대로 177', '37.388292', '126.643208', '자판기', '마트 운영시간'),
('PC-0128', '롯데마트 청라국제도시점', '인천광역시 서구 청라커낼로 252', '37.531391', '126.648749', '자판기', '마트 운영시간'),
('PC-0129', '롯데마트 춘천점', '강원특별자치도 춘천시 방송길 84', '37.868696', '127.717993', '자판기', '마트 운영시간'),
('PC-0130', '롯데마트 대구율하점', '대구광역시 동구 율하동 1117', '35.868882', '128.692788', '자판기', '마트 운영시간'),
('PC-0131', '롯데마트 수완점', '광주광역시 광산구 장신로 98', '35.190276', '126.821003', '자판기', '마트 운영시간'),
('PC-0132', '롯데마트 아산터미널점', '충청남도 아산시 모종동 번영로 225', '36.784662', '127.016027', '자판기', '마트 운영시간'),
('PC-0133', '롯데마트 서산점', '충청남도 서산시 충의로 27', '36.773401', '126.439264', '자판기', '마트 운영시간'),
('PC-0134', 'KTX 영등포역', '서울특별시 영등포구 경인로 846', '37.515602', '126.907307', '자판기', '문의'),
('PC-0135', 'KTX 행신역', '경기도 고양시 덕양구 소원로 102', '37.612278', '126.834058', '자판기', '문의'),
('PC-0136', 'KTX 서대전역', '대전광역시 중구 오류로 23', '36.322531', '127.403802', '자판기', '문의'),
('PC-0137', 'KTX 부산역', '부산광역시 동구 초량제3동 중앙대로', '35.115235', '129.042176', '자판기', '문의'),
('PC-0138', 'KTX 천안아산역', '충남 아산시 배방읍 희망로 100', '36.794538', '127.104345', '자판기', '문의'),
('PC-0139', '롯데월드 부스럭롯데월드몰', '서울특별시 송파구 올림픽로 240', '37.511124', '127.098022', '자판기', '문의'),
('PC-0140', '롯데월드 2층 어드벤처', '서울특별시 송파구 올림픽로 240 2층', '37.511124', '127.098022', '자판기', '문의'),
('PC-0141', '롯데월드 4층 어드벤처', '서울특별시 송파구 올림픽로 240 4층', '37.511124', '127.098022', '자판기', '문의'),
('PC-0142', '이마트 천호점', '서울특별시 강동구 천호대로 1017', '37.538655', '127.125368', '자판기', '마트 운영시간'),
('PC-0143', '이마트 하월곡점', '서울특별시 성북구 종암로 167', '37.604839', '127.030908', '자판기', '마트 운영시간'),
('PC-0144', '이마트 용산점', '서울특별시 용산구 한강대로23길 55', '37.529563', '126.965491', '자판기', '마트 운영시간'),
('PC-0145', '이마트 왕십리점', '서울특별시 성동구 왕십리광장로 17', '37.561977', '127.038223', '자판기', '마트 운영시간'),
('PC-0146', '이마트 월계점', '서울특별시 노원구 마들로3길 15', '37.626542', '127.061952', '자판기', '마트 운영시간'),
('PC-0147', '이마트 자양점', '서울특별시 광진구 아차산로 272', '37.538458', '127.072862', '자판기', '마트 운영시간'),
('PC-0148', '이마트 목동점', '서울특별시 양천구 오목로 299', '37.525904', '126.870327', '자판기', '마트 운영시간'),
('PC-0149', '이마트 구로점', '서울특별시 구로구 디지털로32길 43', '37.484427', '126.897903', '자판기', '마트 운영시간'),
('PC-0150', '이마트 마포점', '서울특별시 마포구 백범로 212', '37.542367', '126.953353', '자판기', '마트 운영시간'),
('PC-0151', '이마트 명일점', '서울특별시 강동구 고덕로 276', '37.554784', '127.156062', '자판기', '마트 운영시간'),
('PC-0152', '이마트 신도림점', '서울특별시 구로구 새말로 97', '37.507111', '126.890251', '자판기', '마트 운영시간'),
('PC-0153', '이마트 영등포점', '서울특별시 영등포구 영중로 15B2F', '37.517156', '126.90292', '자판기', '마트 운영시간'),
('PC-0154', '이마트 은평점', '서울특별시 은평구 은평로 111', '37.600463', '126.920172', '자판기', '마트 운영시간'),
('PC-0155', '이마트 TK고양점', '경기도 고양시 덕양구 고양대로 1955', '37.648114', '126.897174', '자판기', '마트 운영시간'),
('PC-0156', '이마트 TK하남점', '경기도 하남시 미사대로 750', '37.545696', '127.223911', '자판기', '마트 운영시간'),
('PC-0157', '이마트 TK안성점', '경기도 안성시 공도읍 서동대로 3930-39', '36.994574', '127.148078', '자판기', '마트 운영시간'),
('PC-0158', '이마트 하남점', '경기도 하남시 덕풍서로 70 풍산지구 이마트', '37.55278', '127.205405', '자판기', '마트 운영시간'),
('PC-0159', '이마트 죽전점', '경기도 용인시 수지구 포은대로 552', '37.325308', '127.109907', '자판기', '마트 운영시간'),
('PC-0160', '이마트 수지점', '경기도 용인시 수지구 수지로 203', '37.319818', '127.083436', '자판기', '마트 운영시간'),
('PC-0161', '이마트 이천점', '경기도 이천시 이섭대천로 1440-50', '37.29395', '127.459151', '자판기', '마트 운영시간'),
('PC-0162', '스타필드마켓 동탄점', '경기도 화성시 동탄중앙로 376', '37.214454', '127.079434', '자판기', '마트 운영시간'),
('PC-0163', '이마트 수원점', '경기도 수원시 권선구 경수대로 270', '37.249908', '127.021761', '자판기', '마트 운영시간'),
('PC-0164', '이마트 여주점', '경기도 여주시 시 세종로 151', '37.284574', '127.635438', '자판기', '마트 운영시간'),
('PC-0165', '이마트 산본점', '경기도 군포시 산본로 347', '37.361136', '126.931269', '자판기', '마트 운영시간'),
('PC-0166', '이마트 파주운정점', '경기도 파주시 한울로 123', '37.710493', '126.745055', '자판기', '마트 운영시간'),
('PC-0167', '이마트 김포한강점', '경기도 김포시 김포한강7로 71', '37.644428', '126.628343', '자판기', '마트 운영시간'),
('PC-0168', '이마트 풍산점', '경기도 고양시 일산동구 하늘마을1로 25', '37.673968', '126.787127', '자판기', '마트 운영시간'),
('PC-0169', '이마트 광명소하점', '경기도 광명시 소하로 97', '37.446736', '126.884565', '자판기', '마트 운영시간'),
('PC-0170', '이마트 부천중동점', '경기도 부천시 원미구 석천로 188', '37.504103', '126.763913', '자판기', '마트 운영시간'),
('PC-0171', '이마트 분당점', '경기도 성남시 분당구 불정로 134', '37.358902', '127.11976', '자판기', '마트 운영시간'),
('PC-0172', '이마트 의정부점', '경기도 의정부시 민락로 210', '37.743174', '127.102222', '자판기', '마트 운영시간'),
('PC-0173', '이마트 TK스타필드수원점', '경기도 수원시 장안구 수성로 175', '37.287427', '126.991937', '자판기', '마트 운영시간'),
('PC-0174', '이마트 화정점', '경기도 고양시 덕양구 백양로 79', '37.632765', '126.833388', '자판기', '마트 운영시간'),
('PC-0175', '이마트 검단점', '인천광역시 서구 당하동 서곶로 754', '37.585619', '126.677216', '자판기', '마트 운영시간'),
('PC-0176', '이마트 대전터미널점', '대전광역시 동구 동서대로 1689 3층, 4층', '36.350232', '127.436654', '자판기', '마트 운영시간'),
('PC-0177', '이마트 세종점', '세종특별자치시 금송로 687', '36.470903', '127.250562', '자판기', '마트 운영시간'),
('PC-0178', '이마트 월배점', '대구광역시 달서구 진천로 92', '35.8173', '128.523548', '자판기', '마트 운영시간'),
('PC-0179', '이마트 김해점', '경상남도 김해시 김해대로 2232', '35.230292', '128.871831', '자판기', '마트 운영시간'),
('PC-0180', '이마트 양산점', '경상남도 양산시 양산역6길 12', '35.336882', '129.02647', '자판기', '마트 운영시간'),
('PC-0181', '이마트 천안서북점', '충청남도 천안시 서북구 삼성대로 20', '36.838695', '127.122334', '자판기', '마트 운영시간'),
('PC-0182', '빛나는스포츠카드샵', '서울 서초구 강남대로 381', '37.4966853437905', '127.02769442385', '카드샵', '문의'),
('PC-0183', '라임이네문구점 디에이치자이개포점', '서울 강남구 영동대로 22', '37.49165487126962', '127.0740688470361', '카드샵', '문의'),
('PC-0184', '구의문구', '서울 광진구 광나루로30다길 4', '37.5432116378236', '127.081575594907', '카드샵', '문의'),
('PC-0185', '리즈스튜디오 TCG', '서울 강남구 논현로26길 36-5', '37.48322506566019', '127.04554118140437', '카드샵', '문의'),
('PC-0186', '밀짚모자 해적단TCG', '서울 중랑구 중랑역로 276', '37.61622107488207', '127.07875229732315', '카드샵', '문의'),
('PC-0187', 'TCG사회복지연구소', '서울 노원구 노원로22길 71', '37.648555725555', '127.075884443236', '카드샵', '문의'),
('PC-0188', '문구방구 영등포아크로타워스퀘어점', '서울 영등포구 국회대로54길 10', '37.524085232273904', '126.90747428203439', '카드샵', '문의'),
('PC-0189', 'TCG마트', '서울 영등포구 당산로38길 4', '37.5289785849785', '126.89870493155', '카드샵', '문의'),
('PC-0190', 'TCG라보', '서울 은평구 가좌로 251', '37.5914711966452', '126.915203643937', '카드샵', '문의'),
('PC-0191', '세딸문구', '부산 기장군 정관읍 방곡로 29', '35.326817713993094', '129.18875041836353', '카드샵', '문의'),
('PC-0192', 'TCG드로우', '부산 남구 수영로298번길 37', '35.1353077851143', '129.099898673726', '카드샵', '문의'),
('PC-0193', '포켓몬카드샵', '대구 달서구 야외음악당로 50', '35.84167383205463', '128.5530220711551', '카드샵', '문의'),
('PC-0194', '빵꾸똥꾸문구야 인천부개점', '인천 부평구 부일로 37', '37.4896647237378', '126.734311312207', '카드샵', '문의'),
('PC-0195', 'TCG플레이어', '광주 서구 화운로 106', '35.14896511442628', '126.87957741554546', '카드샵', '문의'),
('PC-0196', 'TCG팩토리', '울산 중구 번영로 454-1', '35.5625890559805', '129.333934944535', '카드샵', '문의'),
('PC-0197', '문구야놀자 세종아름점', '세종특별자치시 달빛로 165', '36.51398040764412', '127.25031293308885', '카드샵', '문의'),
('PC-0198', 'TCG백화점', '경기 성남시 분당구 야탑로111번길 5-3', '37.4100306803041', '127.130787421978', '카드샵', '문의'),
('PC-0199', '포켓몬코리아', '경기 용인시 수지구 신수로 801', '37.3417467983447', '127.102153513624', '공식', '문의'),
('PC-0200', '라스TCG', '경기 안산시 단원구 중앙대로 907', '37.31740339352979', '126.83726372504802', '카드샵', '문의'),
('PC-0201', 'TCG', '경기 파주시 운정로 165', '37.7200574439534', '126.783828898853', '카드샵', '문의'),
('PC-0202', 'TCG카드프리덤', '충북 청주시 서원구 수곡로 98', '36.62065640346691', '127.47112315096238', '카드샵', '문의'),
('PC-0203', '카본TCG', '전북특별자치도 전주시 덕진구 반룡로 109', '35.8582670477381', '127.08337138445675', '카드샵', '문의'),
('PC-0204', 'TCG팩토리', '전남 목포시 비파로51번길 20', '34.8024522405316', '126.42475355951609', '카드샵', '문의'),
('PC-0205', 'TCG몰 앨리스CW', '경남 창원시 성산구 반지로16번길 29-1', '35.2388396181533', '128.662889611956', '카드샵', '문의'),
('PC-0206', 'TCG짐카페에이 경남본점', '경남 창원시 의창구 남산로17번길 2', '35.25944219151985', '128.61230598081525', '카드샵', '문의'),
('PC-0207', 'TCG팩토리', '경남 진주시 진양호로547번길 5', '35.1936699299708', '128.084940444768', '카드샵', '문의'),
('PC-0208', 'TCG아일랜드', '제주특별자치도 제주시 중앙로 197-1', '33.501717044634', '126.528570049576', '카드샵', '문의')
on conflict (place_key) do update set name=excluded.name, addr=excluded.addr, lat=excluded.lat, lng=excluded.lng, type=excluded.type, hours=excluded.hours;
commit;
