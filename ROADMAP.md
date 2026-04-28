# MVP 로드맵

> 혼자 개발 기준, 주말+저녁 작업으로 약 6~8주 예상.

---

## 🎯 MVP 정의 (최소 출시 가능)

- 서울 25개 구 한정
- 시드 매장 100개+ 등록
- 핸드폰 OTP 로그인
- 매장 검색 + 지도 표시
- 글쓰기 + 댓글 + 좋아요
- 신고 기능 (수동 처리)
- 약관/개인정보 게시

---

## 📅 Week-by-Week

### Week 1 — 기반 셋업
- [ ] Lovable 또는 로컬 Vite 프로젝트 생성
- [ ] GitHub repo 생성 + 양방향 sync
- [ ] Supabase 프로젝트 생성
- [ ] `SUPABASE_SCHEMA.sql` 실행
- [ ] Tailwind + 디자인 토큰 셋업
- [ ] Galmuri11 폰트 추가
- [ ] 기본 라우팅 (`react-router-dom` 또는 Lovable 라우팅)

**산출물**: 빈 페이지 9개 (라우팅만), 디자인 토큰 정상 적용된 PixelButton

### Week 2 — 디자인 시스템 + Home/Map
- [ ] 공통 UI 컴포넌트 다 만들기
  - PixelButton, PixelBorder, Sprite, GBTabBar, PixelInput, Phone wrapper
- [ ] HomePage 구현 (정적 데이터 OK)
- [ ] MapPage — 카카오맵 SDK 연동
- [ ] 위치 검색 페이지 — 시/구 선택

**산출물**: Home + Map + 위치선택 작동, 카카오 핀 표시

### Week 3 — 인증 + Profile
- [ ] Supabase Auth Phone Provider 활성화 + Twilio 연동
- [ ] LoginPage 3-step 구현
- [ ] AuthWall, RequireAuth 가드
- [ ] ProfilePage (읽기/편집/탈퇴)
- [ ] 약관/개인정보 페이지 작성 + 가입 동의 UI

**산출물**: 핸드폰 → OTP → ID 등록 → 로그인 완료, 마이페이지 동작

### Week 4 — 글쓰기 + 커뮤니티
- [ ] PostPage (4 섹션 폼) — DB INSERT
- [ ] 매장 검색 picker (Supabase 검색)
- [ ] 새 매장 등록 폼
- [ ] CommunityPage — 글 리스트 + 필터 (최신/위치/찾기)
- [ ] PostDetailPage — 본문 + 댓글 + 좋아요

**산출물**: 글쓰기 → 커뮤니티 노출 → 상세 → 댓글까지 풀 플로우

### Week 5 — 매장 데이터 + 폴리시
- [ ] `CRAWLING_GUIDE.md` 따라 시드 100~200개 수집
- [ ] Supabase에 일괄 import
- [ ] 카카오맵에 표시 + 거리순 정렬 검증
- [ ] Map 페이지 FILTER, INDEX 등 디테일 마무리
- [ ] 신고 기능
- [ ] 에러 핸들링 (네트워크 끊김, 권한 거부)
- [ ] 로딩 스켈레톤

**산출물**: 실제 매장 데이터로 작동하는 풀 앱

### Week 6 — 베타 테스트
- [ ] 친한 트레이너 5~10명 비공개 베타
- [ ] 버그 fix
- [ ] 카피 다듬기
- [ ] 모바일 사파리/크롬 테스트
- [ ] 도메인 구매 + 배포 (Vercel)
- [ ] PWA 설정 (홈화면 아이콘)
- [ ] 카카오 개발자센터 운영 도메인 등록

**산출물**: 외부 공개 가능한 URL

### Week 7~8 — 출시 + 운영
- [ ] 트레이너 커뮤니티 (디시, 루리웹, 트위터) 홍보
- [ ] 사용자 피드백 → fix
- [ ] 매장 데이터 추가 (사용자 등록 + 관리자 검증)
- [ ] 신고 처리 운영
- [ ] 신상 박스 출시 시기에 푸시 (POST-MVP 기능 검토)

---

## 🚀 POST-MVP (출시 후 1~3개월)

우선순위:
1. **푸시 알림** (FCM): 내가 즐겨찾기 한 매장에 신상 입고 글 → 푸시
2. **즐겨찾기**: 매장 별 따라다니기
3. **이미지 업로드**: 글에 사진 첨부 (Supabase Storage)
4. **Confirm 투표**: 글 정보 사실 확인 (다른 트레이너가 "맞아요" 누르기)
5. **체크인**: GPS로 매장 인증 → 트레이너 레벨
6. **지역 확장**: 부산 → 대전 → 전국
7. **앱화** (Capacitor 또는 Expo로 wrap)

---

## 📊 핵심 지표 (KPI)

출시 후 트래킹:
- DAU / MAU
- 가입 → 글쓰기 전환율
- 글당 평균 댓글/좋아요
- 매장 신규 등록 수 (사용자 기여)
- 신고 처리 시간
- 푸시 opt-in율 (POST-MVP)

추천 도구: PostHog (오픈소스, 무료 tier 충분)

---

## 🛠 기술 부채 / 리팩터링 (POST-MVP)

- TanStack Query 로 데이터 페칭 통일
- Suspense + Error Boundary
- 매장 검색 인덱싱 (PostgreSQL FTS 또는 typesense)
- 이미지 CDN (Cloudflare Images 또는 Supabase Storage + transform)
- E2E 테스트 (Playwright)
- 모니터링 (Sentry)

---

## 💰 예상 비용 (월)

| 항목 | 비용 |
|---|---|
| Supabase Free tier | $0 (500MB DB, 1GB 파일, 50MAU 충분 초반) |
| Supabase Pro (Pro 시) | $25 |
| Vercel Hobby | $0 (개인 프로젝트) |
| 카카오맵 API | $0 (일 30만 건 무료) |
| Twilio SMS | 가입자 100명 기준 약 $4 (1인 1회 인증) |
| 도메인 | 연 ₩15,000 |

**초기 1~3개월 ≈ 월 ₩10,000** 정도면 운영 가능.

---

## 🧠 혼자 개발 팁

- **완벽주의 X**: 첫 출시는 "동작하면 OK"
- **트레이너 친구 1~2명** 베타 빌드 줘서 매주 피드백
- **커뮤니티 게시판** 미리 만들어두지 말고, 사용자 글이 쌓이는 걸 보면서 정리
- **운영 자동화 X**: 신고 처리 등은 첫 100명 정도까지는 수동
- **Lovable 활용**: UI 변경은 Lovable에서, 복잡한 로직은 Cursor에서 — 도구 분업
