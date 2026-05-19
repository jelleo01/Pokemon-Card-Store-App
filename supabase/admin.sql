-- ============================================================
-- 관리자 시스템 뼈대 — schema.sql 적용 후에 실행
-- 사용법: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- ============================================================

-- ─── 1. 공지사항 (notices) ────────────────────────────────
create table if not exists notices (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  pinned       boolean default false,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_notices_pinned_created
  on notices(pinned desc, created_at desc);

-- ─── 2. 문의하기 (inquiries) ──────────────────────────────
create table if not exists inquiries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete set null,  -- 익명 가능
  subject      text not null,
  body         text not null,
  contact      text,                                              -- 회신용 이메일/연락처
  status       text default 'open',                               -- open | resolved
  admin_note   text,
  created_at   timestamptz default now(),
  resolved_at  timestamptz
);
create index if not exists idx_inquiries_status_created
  on inquiries(status, created_at desc);

-- ─── 3. 앱 메타 (버전 / 약관 / 개인정보처리방침 / admin_email) ─
create table if not exists app_meta (
  key          text primary key,
  value        text not null,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz default now()
);

-- 기본값 seed (없으면 INSERT, 있으면 UPDATE 안 함)
insert into app_meta (key, value) values
  ('version',  'v0.1'),
  ('terms',    '## 이용약관

본 약관은 포켓몬 카드샵 커뮤니티(이하 "서비스")의 이용 조건을 규정합니다.

(베타 — 정식 약관 작업 중)'),
  ('privacy',  '## 개인정보 처리방침

수집 항목: 이메일, 트레이너 아이디, 지역
이용 목적: 커뮤니티 서비스 제공, 본인 확인
보관 기간: 회원 탈퇴 시까지

(베타 — 정식 정책 작업 중)'),
  ('admin_email', '')
on conflict (key) do nothing;

-- ============================================================
-- RLS 정책
-- ============================================================
alter table notices    enable row level security;
alter table inquiries  enable row level security;
alter table app_meta   enable row level security;

-- ─── notices ───
-- 모두 읽기, 관리자만 쓰기/수정/삭제
drop policy if exists "notices: read all"     on notices;
drop policy if exists "notices: insert admin" on notices;
drop policy if exists "notices: update admin" on notices;
drop policy if exists "notices: delete admin" on notices;

create policy "notices: read all"     on notices for select using (true);
create policy "notices: insert admin" on notices for insert with check (is_admin(auth.uid()));
create policy "notices: update admin" on notices for update using (is_admin(auth.uid()));
create policy "notices: delete admin" on notices for delete using (is_admin(auth.uid()));

-- ─── inquiries ───
-- 본인 글만 읽기, 관리자는 모두 읽기 / 로그인 사용자만 쓰기 / 관리자만 수정·삭제
drop policy if exists "inquiries: read own or admin" on inquiries;
drop policy if exists "inquiries: insert auth"      on inquiries;
drop policy if exists "inquiries: update admin"     on inquiries;
drop policy if exists "inquiries: delete admin"     on inquiries;

create policy "inquiries: read own or admin" on inquiries for select using (
  auth.uid() = user_id or is_admin(auth.uid())
);
create policy "inquiries: insert auth" on inquiries for insert with check (
  auth.uid() is not null and (user_id is null or auth.uid() = user_id)
);
create policy "inquiries: update admin" on inquiries for update using (is_admin(auth.uid()));
create policy "inquiries: delete admin" on inquiries for delete using (is_admin(auth.uid()));

-- ─── app_meta ───
-- 모두 읽기, 관리자만 수정
drop policy if exists "app_meta: read all"     on app_meta;
drop policy if exists "app_meta: insert admin" on app_meta;
drop policy if exists "app_meta: update admin" on app_meta;

create policy "app_meta: read all"     on app_meta for select using (true);
create policy "app_meta: insert admin" on app_meta for insert with check (is_admin(auth.uid()));
create policy "app_meta: update admin" on app_meta for update using (is_admin(auth.uid()));

-- ─── is_admin 함수를 SECURITY DEFINER 로 재정의 ────────────
-- 원본(schema.sql)은 SECURITY INVOKER 라서 admins 테이블 RLS 에 막혀
-- 본인이 admin 인지 체크하는 것 자체가 불가능 (chicken-and-egg).
-- DEFINER 로 만들어 RLS 우회.
create or replace function is_admin(uid uuid) returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = uid);
$$;
revoke all on function is_admin(uuid) from public;
grant execute on function is_admin(uuid) to authenticated, anon;

-- ─── shops 추가 정책 (admin 삭제) ─────────────────────────
drop policy if exists "shops: delete admin" on shops;
create policy "shops: delete admin" on shops for delete using (is_admin(auth.uid()));

-- ============================================================
-- 관리자 전용 RPC 함수 (auth.users.email 접근, admin 권한 관리)
-- ============================================================

-- 가입자 목록 — auth.users 의 email 까지 join 해서 반환.
-- security definer 로 auth.users 접근. 함수 내부에서 admin 권한 체크.
create or replace function admin_list_users()
returns table (
  id           uuid,
  email        text,
  trainer_id   text,
  city         text,
  district     text,
  phone        text,
  created_at   timestamptz,
  is_admin     boolean,
  posts_count  bigint
)
language plpgsql security definer stable
set search_path = public, auth
as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'unauthorized: admin only';
  end if;
  return query
  select
    p.id,
    u.email::text,
    p.trainer_id,
    p.city,
    p.district,
    p.phone,
    p.created_at,
    exists(select 1 from admins a where a.user_id = p.id) as is_admin,
    (select count(*) from posts where user_id = p.id) as posts_count
  from profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;
revoke all on function admin_list_users() from public;
grant execute on function admin_list_users() to authenticated;

-- 관리자 권한 부여
create or replace function admin_grant(target_uid uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'unauthorized: admin only';
  end if;
  insert into admins (user_id) values (target_uid)
  on conflict (user_id) do nothing;
end;
$$;
revoke all on function admin_grant(uuid) from public;
grant execute on function admin_grant(uuid) to authenticated;

-- 관리자 권한 해제 (본인은 해제 불가 — last admin lockout 방지)
create or replace function admin_revoke(target_uid uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'unauthorized: admin only';
  end if;
  if target_uid = auth.uid() then
    raise exception '본인은 관리자에서 해제할 수 없습니다';
  end if;
  delete from admins where user_id = target_uid;
end;
$$;
revoke all on function admin_revoke(uuid) from public;
grant execute on function admin_revoke(uuid) to authenticated;

-- 대시보드 통계
create or replace function admin_stats()
returns table (
  users_count    bigint,
  shops_count    bigint,
  posts_count    bigint,
  comments_count bigint,
  notices_count  bigint,
  inquiries_open bigint
)
language plpgsql security definer stable
set search_path = public
as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'unauthorized: admin only';
  end if;
  return query select
    (select count(*) from profiles),
    (select count(*) from shops),
    (select count(*) from posts),
    (select count(*) from comments),
    (select count(*) from notices),
    (select count(*) from inquiries where status = 'open');
end;
$$;
revoke all on function admin_stats() from public;
grant execute on function admin_stats() to authenticated;

-- ─── 관리자 등록 (수동) ───────────────────────────────────
-- 본인을 관리자로 등록하려면 아래 주석 해제 후 trainer_id 변경:
-- insert into admins (user_id) select id from profiles where trainer_id = '내아이디';
