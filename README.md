# 트레이너 카드샵 맵 — Handoff Package

> **포켓몬 TCG 트레이너들을 위한 매장 정보 + 커뮤니티 앱**  
> Game Boy / Pokémon Trainer 픽셀 스타일

---

## 📦 폴더 구조

```
.
├── README.md              ← 지금 보고 있는 파일
├── docs/                  설계 / 가이드 문서
│   ├── HANDOFF.md             핸드오프 시작 가이드
│   ├── MVP_SPEC.md            화면별 기능 명세
│   ├── ROADMAP.md             Week-by-week MVP 로드맵
│   ├── KAKAO_MAP_GUIDE.md     카카오맵 SDK 통합 가이드
│   ├── CRAWLING_GUIDE.md      매장 데이터 수집 전략
│   ├── REGIONS_DATA.md        시/군/구 데이터 출처 + 형식
│   └── LEGAL_CHECKLIST.md     약관/개인정보처리방침 체크리스트
├── supabase/
│   └── schema.sql             DB 스키마 + RLS 정책 (Supabase SQL Editor 에 붙여넣기)
├── design-source/         디자인 캔버스 원본 (앱에선 안 씀, 참고용)
│   ├── Pokemon Cards.html
│   ├── design-canvas.jsx
│   ├── ios-frame.jsx
│   ├── data.jsx
│   ├── tokens.css
│   └── version-gameboy*.jsx
├── scripts/
│   └── crawl-shops.mjs        매장 자동 크롤링 (Node 20.6+)
└── src/
    ├── components/ui/         픽셀 UI 컴포넌트 (PixelButton, Sprite, KakaoMap, ...)
    ├── pages/                 화면 9개 (Home, Map, Post, ...)
    ├── lib/                   data, kakao, supabase, gbStyles, mapMarkers, seedShops
    ├── contexts/              AuthContext
    ├── styles/                tokens.css + index.css
    └── types/                 kakao.d.ts
```

---

## 🚀 빠른 시작 (Lovable 사용)

1. **새 Lovable 프로젝트 생성** — Vite + React + Supabase 템플릿 선택
2. **GitHub repo 연결** — Lovable 우상단 GitHub 아이콘 → 저장소 연결
3. 이 `handoff/src/` 안의 파일들을 복사해 Lovable 프로젝트에 넣기
4. `supabase/schema.sql` 을 Supabase SQL Editor에 붙여넣어 실행
5. 환경변수 설정 (.env):
   ```
   VITE_KAKAO_MAP_KEY=xxxxx
   VITE_SUPABASE_URL=xxxxx
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```
6. `npm install && npm run dev`

---

## 🛠 기술 스택 (결정 사항)

| 분류 | 선택 | 이유 |
|---|---|---|
| **빌드** | Vite + React + TypeScript | Lovable 기본 스택 |
| **스타일** | Tailwind CSS + CSS variables (tokens) | Lovable 기본, 빠른 prototyping |
| **백엔드** | Supabase (Auth + Postgres + Storage) | OTP, RLS, 무료 tier 충분 |
| **지도** | Kakao Map JavaScript SDK | 한국 지도 정확도 + 무료 |
| **상태** | React Context (간단) → 필요 시 Zustand | MVP는 Context로 충분 |
| **라우팅** | React Router v6 | |
| **폼** | react-hook-form + zod | |

---

## 📋 MVP 범위 (확정)

### ✅ 포함
- 핸드폰 OTP 로그인 + 트레이너 ID 설정
- 매장 지도 (카카오맵) + 매장 검색 + 거리순 리스트
- 매장 정보 글쓰기 (소식 / 질문)
- 커뮤니티 피드 + 시/구 필터 + 댓글 + 좋아요
- 게시글 신고 → 관리자 페이지
- 위치 권한 요청 + 거리 계산

### ❌ 후순위 (V1.5+)
- 푸시 알림
- 이미지 업로드
- 실시간 영업시간
- 트레이너 레벨 / 체크인 / 즐겨찾기
- 자동 어뷰징 방지 (수동 신고만)

---

## 📌 다음에 읽을 문서

> 순서대로 읽으면 전체 그림이 잡혀요.

1. **`docs/ROADMAP.md`** — 6주 MVP 일정 한눈에 보기
2. **`docs/MVP_SPEC.md`** — 화면별로 무엇을 구현할지
3. **`supabase/schema.sql`** — DB 만들기
4. **`docs/KAKAO_MAP_GUIDE.md`** — 지도 띄우기
5. **`docs/CRAWLING_GUIDE.md`** — 매장 데이터 모으기
6. 나머지 (Regions, Legal) — 필요할 때

---

## 🎨 디자인 원본

- 메인 디자인 캔버스: `design-source/Pokemon Cards.html` (브라우저로 열면 모든 화면 확인 가능)
- 디자인 토큰: `design-source/tokens.css`
- 폰트: Galmuri11 (한글 픽셀, quiple/galmuri CDN), Geist (영문)

---

## ❓ 자주 막힐 것 같은 곳 미리

- **Lovable에서 카카오맵 안 뜸** → `index.html` 에 SDK script 직접 추가 (가이드 03 참고)
- **Supabase OTP 한국 번호** → SMS 게이트웨이 직접 설정 필요 (Twilio / 알리고). 가이드 01에 있음
- **매장 좌표 부정확** → 카카오 로컬 검색 API의 `address_search` 사용. 가이드 04 참고
- **시/군/구 데이터** → 행정안전부 공공데이터 사용 (가이드 05). 한 번 수집 후 `regions.json` 으로 박제

---

질문 있으면 디자인 원본 옆에 두고 작업하세요. 행운을 빕니다! 🎮
