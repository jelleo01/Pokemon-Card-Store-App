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

-- ─── 관리자 등록 (수동) ───────────────────────────────────
-- 본인을 관리자로 등록하려면 아래 주석 해제 후 trainer_id 변경:
-- insert into admins (user_id) select id from profiles where trainer_id = '내아이디';
