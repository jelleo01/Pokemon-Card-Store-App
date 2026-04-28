-- ============================================================
-- 포켓몬 카드샵 커뮤니티 — Supabase 스키마
-- 사용법: Supabase Dashboard → SQL Editor → 전체 붙여넣기 → Run
-- ============================================================

-- ─── 1. ENUM 타입 ─────────────────────────────────────────
create type shop_type as enum ('cardshop', 'vending', 'cvs', 'popup');
create type post_category as enum ('news', 'ask');
create type stock_level as enum ('high', 'mid', 'low', 'unknown');
create type report_target as enum ('post', 'comment', 'shop', 'user');

-- ─── 2. profiles (사용자 프로필) ─────────────────────────
-- auth.users 와 1:1 연결
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  trainer_id   text unique not null check (char_length(trainer_id) between 2 and 12),
  phone        text,
  city         text,         -- 시
  district     text,         -- 구
  notif_news   boolean default true,
  notif_comment boolean default true,
  marketing_opt_in boolean default false,
  terms_agreed_at timestamptz default now(),
  created_at   timestamptz default now()
);
create index idx_profiles_trainer_id on profiles(trainer_id);

-- ─── 3. shops (매장) ───────────────────────────────────────
create table shops (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         shop_type not null,
  addr         text not null,
  lat          double precision not null,
  lng          double precision not null,
  city         text,         -- 시 (예: 서울)
  district     text,         -- 구 (예: 강남구)
  dong         text,         -- 동
  phone        text,
  hours        text,         -- 자유 형식: "11:00-22:00"
  website      text,
  verified     boolean default false,  -- 관리자 검증 여부
  created_by   uuid references profiles(id),  -- 새 장소 등록한 사람
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index idx_shops_loc       on shops(city, district);
create index idx_shops_type      on shops(type);
create index idx_shops_lat_lng   on shops(lat, lng);

-- ─── 4. posts (게시글) ─────────────────────────────────────
create table posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  shop_id      uuid references shops(id),  -- nullable: 새 매장 등록 못한 경우
  category     post_category not null,
  body         text not null check (char_length(body) between 5 and 280),
  tags         text[] default '{}',  -- ["신상 박스 입고", "잔여 적음"]
  stock_level  stock_level default 'unknown',
  photo_url    text,
  hearts_count integer default 0,
  comments_count integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index idx_posts_created on posts(created_at desc);
create index idx_posts_shop    on posts(shop_id);
create index idx_posts_user    on posts(user_id);
create index idx_posts_category on posts(category);

-- ─── 5. comments (댓글) ───────────────────────────────────
create table comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 200),
  created_at   timestamptz default now()
);
create index idx_comments_post on comments(post_id, created_at);

-- ─── 6. hearts (좋아요) ───────────────────────────────────
create table hearts (
  user_id      uuid not null references profiles(id) on delete cascade,
  post_id      uuid not null references posts(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (user_id, post_id)
);

-- ─── 7. shop_confirms (매장/재고 정보 confirm 투표) ────────
-- 다른 트레이너가 글 내용을 "맞아요" 확인
create table shop_confirms (
  user_id      uuid not null references profiles(id) on delete cascade,
  post_id      uuid not null references posts(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (user_id, post_id)
);

-- ─── 8. reports (신고) ────────────────────────────────────
create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles(id) on delete cascade,
  target_type  report_target not null,
  target_id    uuid not null,
  reason       text not null,
  detail       text,
  resolved     boolean default false,
  created_at   timestamptz default now()
);
create index idx_reports_unresolved on reports(resolved, created_at);

-- ─── 9. admins (관리자) ───────────────────────────────────
create table admins (
  user_id      uuid primary key references profiles(id) on delete cascade,
  created_at   timestamptz default now()
);

-- ─── 10. 트리거: counts 자동 갱신 ──────────────────────────
create or replace function bump_post_hearts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update posts set hearts_count = hearts_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set hearts_count = greatest(0, hearts_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$;
create trigger trg_hearts after insert or delete on hearts
  for each row execute function bump_post_hearts();

create or replace function bump_post_comments()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = greatest(0, comments_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$;
create trigger trg_comments after insert or delete on comments
  for each row execute function bump_post_comments();

-- ─── 11. RPC: 거리 계산 ───────────────────────────────────
-- 클라이언트에서 lat,lng로 가까운 매장 가져오기
create or replace function shops_near(lat double precision, lng double precision, radius_km double precision default 3)
returns setof shops language sql stable as $$
  select * from shops
  where (
    6371 * acos(
      cos(radians(lat)) * cos(radians(shops.lat))
      * cos(radians(shops.lng) - radians(lng))
      + sin(radians(lat)) * sin(radians(shops.lat))
    )
  ) <= radius_km
  order by (
    6371 * acos(
      cos(radians(lat)) * cos(radians(shops.lat))
      * cos(radians(shops.lng) - radians(lng))
      + sin(radians(lat)) * sin(radians(shops.lat))
    )
  );
$$;

-- ─── 12. is_admin helper ──────────────────────────────────
create or replace function is_admin(uid uuid) returns boolean
language sql stable as $$
  select exists (select 1 from admins where user_id = uid);
$$;

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================
alter table profiles      enable row level security;
alter table shops         enable row level security;
alter table posts         enable row level security;
alter table comments      enable row level security;
alter table hearts        enable row level security;
alter table shop_confirms enable row level security;
alter table reports       enable row level security;
alter table admins        enable row level security;

-- profiles
create policy "profiles: read all"  on profiles for select using (true);
create policy "profiles: insert self" on profiles for insert with check (auth.uid() = id);
create policy "profiles: update self" on profiles for update using (auth.uid() = id);
create policy "profiles: delete self" on profiles for delete using (auth.uid() = id);

-- shops (모두 읽기, 로그인 사용자만 쓰기, 본인이 만든 매장만 수정)
create policy "shops: read all"     on shops for select using (true);
create policy "shops: insert auth"  on shops for insert with check (auth.uid() is not null);
create policy "shops: update own or admin" on shops for update using (
  auth.uid() = created_by or is_admin(auth.uid())
);

-- posts
create policy "posts: read all"     on posts for select using (true);
create policy "posts: insert auth"  on posts for insert with check (auth.uid() = user_id);
create policy "posts: update own"   on posts for update using (auth.uid() = user_id);
create policy "posts: delete own or admin" on posts for delete using (
  auth.uid() = user_id or is_admin(auth.uid())
);

-- comments
create policy "comments: read all"  on comments for select using (true);
create policy "comments: insert auth" on comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own or admin" on comments for delete using (
  auth.uid() = user_id or is_admin(auth.uid())
);

-- hearts
create policy "hearts: read all"    on hearts for select using (true);
create policy "hearts: insert self" on hearts for insert with check (auth.uid() = user_id);
create policy "hearts: delete self" on hearts for delete using (auth.uid() = user_id);

-- shop_confirms
create policy "confirms: read all"   on shop_confirms for select using (true);
create policy "confirms: insert self" on shop_confirms for insert with check (auth.uid() = user_id);
create policy "confirms: delete self" on shop_confirms for delete using (auth.uid() = user_id);

-- reports (사용자는 본인 신고만 보고, 관리자는 전체)
create policy "reports: read own or admin" on reports for select using (
  auth.uid() = reporter_id or is_admin(auth.uid())
);
create policy "reports: insert auth"  on reports for insert with check (auth.uid() = reporter_id);
create policy "reports: update admin" on reports for update using (is_admin(auth.uid()));

-- admins (오직 admin만 읽기/쓰기)
create policy "admins: admin only read"   on admins for select using (is_admin(auth.uid()));
create policy "admins: admin only write"  on admins for all    using (is_admin(auth.uid()));
