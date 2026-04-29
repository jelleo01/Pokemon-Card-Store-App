# MVP 기능 명세

> 모든 화면의 동작·인터랙션·상태·API 호출을 정리. 구현 시 이 문서가 SSOT(single source of truth).

---

## 🎯 전체 원칙

- **모바일 웹 우선** (PWA 검토 가능). 데스크탑은 모바일 프레임 + 가운데 정렬.
- **로그인 필요 화면**: Post(글쓰기), Community(글 읽기/댓글), Profile, Post Detail
- **로그인 불필요**: Home, Map, 위치 검색, Login, Auth Wall
- 비로그인 사용자가 Community/Post 진입 시 → Auth Wall로 리다이렉트

---

## 📱 화면 목록

| # | 화면 | 라우트 | 인증 |
|---|---|---|---|
| 1 | Home | `/` | X |
| 2 | Map | `/map` | X |
| 3 | 위치 검색 | `/location` | X |
| 4 | Login | `/login` | X |
| 5 | Auth Wall | `/auth-wall?redirect=...` | X |
| 6 | Post (글쓰기) | `/post` | O |
| 7 | Community | `/community` | O |
| 8 | Post Detail | `/post/:id` | O |
| 9 | Profile | `/profile` | O |

---

## 1. Home (`/`)

### 레이아웃
- **상단 헤더**: 로고 + 사용자 위치 (예: "강남구 역삼동 ▼") + 우측 사람 아이콘 (프로필)
- **메인 메뉴 3개**: 매장 찾기 / 글쓰기 / 커뮤니티
- **위치선택 박스**: 현재 선택된 시/구 + 변경 버튼
- **통계 스트립**: "이번 주 N건 신상 입고 · M명 활동" (DB에서 집계)
- **하단 탭바**: HOME / MAP / COMMUNITY

### 인터랙션
- 위치 라벨 클릭 → `/location` 이동
- 매장 찾기 → `/map`
- 글쓰기 → 로그인 시 `/post`, 비로그인 시 `/auth-wall?redirect=/post`
- 커뮤니티 → 로그인 시 `/community`, 비로그인 시 `/auth-wall?redirect=/community`
- 사람 아이콘 → 로그인 시 `/profile`, 비로그인 시 `/login`

### API 호출
- `GET /shops?near=lat,lng&limit=3` (가까운 3개 미리보기)
- `GET /stats/weekly` (주간 신상/활동 통계)

### 상태
- `location: { city, district }` — Supabase user metadata 또는 localStorage
- `user: User | null`

---

## 2. Map (`/map`)

### 레이아웃
- **상단 헤더**: ◀ + MAP 타이틀 + "강남 · 거리순" 표시
- **검색 바**: "매장 / 주소 / 종류 찾기..." 클릭 시 검색 모달
- **지도 영역**: 카카오맵 + 매장 핀들 (#001~006 인덱스) + INDEX 토글 + ± 줌 컨트롤
- **FILTER 토글 행**: 4가지 매장 종류 (카드샵/자판기/편의점/팝업) on/off
- **매장 리스트**: 거리순 정렬, 각 항목 GO ▶ 버튼 → 카카오맵 길찾기 외부 링크
- **하단 탭바**

### 인터랙션
- 핀 클릭 → 매장 카드 토글 다운 (이름/주소/거리/재고/최근 글)
- GO 버튼 → 카카오맵 길찾기 URL 새 탭
- INDEX 토글 → 핀에 번호 표시 on/off
- FILTER → 매장 종류별 필터 (다중 선택)
- 리스트 항목 클릭 → 핀으로 지도 이동 + 카드 열림

### API 호출
- `GET /shops?near=lat,lng&types=...&radius=2km`
- 길찾기: `https://map.kakao.com/?sName=내위치&eName=매장명` (외부 URL)

### 카카오맵 통합
→ `docs/KAKAO_MAP_GUIDE.md` 참고

---

## 3. 위치 검색 (`/location`)

### 레이아웃
- ◀ 뒤로 + "지역 선택" 헤더
- **검색 입력**: "동/구/시 검색"
- **시 칩 행**: 서울 / 경기 / 인천 / 부산 ... (전체 버튼 포함)
- **구 리스트**: 선택된 시의 구 목록 (체크 표시)
- **현재 위치 사용** 큰 버튼 → Geolocation API → 카카오 reverse geocoding

### 인터랙션
- 구 선택 → user_location 저장 → `/` 이동
- 현재 위치 → 권한 요청 → 좌표 → `kakao.maps.services.Geocoder.coord2RegionCode` → 행정구역 변환

### API 호출
- 카카오 Geocoder (클라이언트)
- `PATCH /user/location` (Supabase RPC)

---

## 4. Login (`/login`)

### 3-step flow
1. **STEP 1 — 핸드폰 번호**
   - 입력: `010-XXXX-XXXX`
   - 약관 동의 체크박스 2개 (필수): 이용약관 / 개인정보처리방침
   - 마케팅 수신 동의 (선택)
   - "인증번호 받기" 버튼

2. **STEP 2 — OTP 6자리**
   - 6자리 입력 (자동 포커스 이동)
   - "02:59" 카운트다운, 재전송 버튼
   - "확인"

3. **STEP 3 — 트레이너 ID**
   - 입력: 한글/영문 2~12자
   - 중복 검사 (실시간)
   - 지역 선택 (시/구) — Home에서 받았던 location 자동 채움
   - "시작하기"

### API 호출
- Supabase Auth: `signInWithOtp({ phone })` → `verifyOtp({ phone, token })`
- ID 등록: `INSERT INTO profiles (user_id, trainer_id, region)`

### 에러 처리
- 잘못된 번호: "올바른 형식이 아니에요"
- OTP 실패: "인증번호가 일치하지 않아요"
- 만료: "인증번호가 만료됐어요. 다시 받기"
- ID 중복: "이미 사용 중인 아이디예요"

---

## 5. Auth Wall (`/auth-wall?redirect=...`)

- 픽셀 자물쇠 아이콘 + "트레이너 등록이 필요해요"
- redirect 파라미터에서 어떤 화면이 막힌건지 표시
- "로그인" 버튼 (큰 빨간) / "둘러보기" 버튼 (Home으로)

---

## 6. Post — 글쓰기 (`/post`)

### 4 섹션
1. **01 장소 / PLACE**
   - 미니 지도 placeholder (선택된 매장 핀 표시)
   - 토글: "이미 있음" / "새 장소"
   - 이미 있음: 매장 검색 picker (이름 검색, 가까운 순)
   - 새 장소: 이름 / 주소 / 종류 입력 폼

2. **02 카테고리 / TYPE**
   - 흰/회 두 카드: ★ 소식 (신상 입고/재고 알림) / ? 질문

3. **03 빠른 태그 / TAG**
   - 칩 다중 선택: + 신상 박스 입고 / 잔여 적음 / 품질 / 재입고 예정 / 싱글 카드

4. **04 내용 / BODY**
   - textarea 280자
   - 사진 / 매장태그 미니버튼 (POST-MVP)

### 인터랙션
- "등록 ▶" 클릭 → validation → INSERT → `/community`
- 새 장소: shops에 INSERT → 그 id를 post에 연결

### Validation
- 장소 필수
- 카테고리 필수
- 본문 5자 이상

### API
- `POST /shops` (새 장소일 때)
- `POST /posts`

---

## 7. Community (`/community`)

### 레이아웃
- 상단: 메가폰 아이콘 + COMMUNITY + "+ 글쓰기"
- **필터 탭**: 최신 / 위치별 / 찾기
- 위치별 활성 시 → 시 칩 + 구 칩 sub-filter 행
- 글 리스트: PostCard
- 하단 "QUESTIONS / 질문" 섹션 (질문 태그 글 2개 미리)

### PostCard
- ★ 소식 / ? 질문 라벨
- 위치 (구 단위)
- 본문 미리보기 2줄
- 매장 정보 (이름 / 종류)
- N분 전 / ♥ 좋아요 수 / 💬 댓글 수

### 인터랙션
- 필터 탭 변경 → 쿼리 재실행
- 시/구 칩 → 필터 누적
- 카드 클릭 → `/post/:id`
- + 글쓰기 → `/post`

### API
- `GET /posts?filter=latest&city=&district=`

---

## 8. Post Detail (`/post/:id`)

### 레이아웃
- ◀ + 매장 이름 헤더
- 작성자 정보 (트레이너 ID, 시간, 위치)
- 카테고리 라벨 + 태그들
- 본문
- 매장 카드 (이름 / 주소 / GO ▶ 길찾기)
- ❤️ 좋아요 (토글) + 신고
- 댓글 리스트
- 하단 댓글 작성 input

### 인터랙션
- 좋아요 토글 → optimistic update
- 신고 → modal → 사유 선택 → 관리자에게 전송
- 댓글 작성 → INSERT → 리스트에 prepend

### API
- `GET /posts/:id` (본문 + 매장 join)
- `GET /comments?post_id=:id`
- `POST /likes` / `DELETE /likes`
- `POST /comments`
- `POST /reports`

---

## 9. Profile (`/profile`)

### 레이아웃
- 픽셀 아바타 (사람 스프라이트) + ✎ 편집 배지
- 트레이너 ID / 가입일 / 지역 / 활동 통계 (작성한 글 / 댓글 / 좋아요 받은 수)
- ACCOUNT 섹션: 아이디 / 핸드폰 / 지역 / 알림 설정
- 편집 모드: 모든 필드 inline input
- 하단: 로그아웃 / 회원 탈퇴 / 약관 다시 보기

### API
- `GET /profile/me`
- `PATCH /profile/me`
- `DELETE /profile/me` (회원 탈퇴 — Supabase auth.users.delete)

---

## 🔗 공통 컴포넌트 매핑

| 디자인 컴포넌트 | 파일 |
|---|---|
| PixelButton | `src/components/ui/PixelButton.tsx` |
| PixelBorder | `src/components/ui/PixelBorder.tsx` |
| Sprite (몬볼/매장/카드/사람) | `src/components/ui/Sprite.tsx` |
| GBTabBar | `src/components/ui/GBTabBar.tsx` |
| PixelInput | `src/components/ui/PixelInput.tsx` |
| Phone (iOS frame) | `src/components/ui/Phone.tsx` |
| ShopCard | `src/components/shop/ShopCard.tsx` |
| ShopPin | `src/components/shop/ShopPin.tsx` |
| PostCard | `src/components/post/PostCard.tsx` |
| CommentItem | `src/components/post/CommentItem.tsx` |

---

## 📊 상태 관리

- 단순한 화면 상태 → `useState`
- 사용자 인증 → Context + `useAuth` hook
- 매장/글 데이터 → **TanStack Query** (`@tanstack/react-query`)
- 글로벌 상태 거의 없음 — Context 1~2개로 충분

---

## 🚦 라우팅

`react-router-dom` v6 사용:
```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/map" element={<MapPage />} />
  <Route path="/location" element={<LocationSearchPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/auth-wall" element={<AuthWallPage />} />
  <Route element={<RequireAuth />}>
    <Route path="/post" element={<PostPage />} />
    <Route path="/community" element={<CommunityPage />} />
    <Route path="/post/:id" element={<PostDetailPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

`<RequireAuth />` 가드: 비로그인 시 `/auth-wall?redirect=...` 로 navigate.
