# 포켓몬 카드샵 커뮤니티 — 핸드오프 가이드

> 게임보이 픽셀 스타일의 모바일 웹앱. 트레이너들이 카드샵·자판기·편의점 위치를 공유하고 신상 입고/재고 정보를 주고받는 서비스.

---

## 📦 이 폴더에 뭐가 들어있나

```
handoff/
├── HANDOFF.md              ← (지금 이 파일) 시작 가이드
├── MVP_SPEC.md             ← 화면별 기능/인터랙션/상태 명세 (가장 중요)
├── supabase/schema.sql     ← DB 스키마 + RLS 정책 — Supabase에 그대로 붙여넣기
├── KAKAO_MAP_GUIDE.md      ← 카카오맵 SDK / Geocoding / 거리 계산
├── CRAWLING_GUIDE.md       ← 매장 시드 데이터 100~200개 수집 전략
├── REGIONS_DATA.md         ← 전국 시/군/구 행정구역 데이터 출처 + JSON 형식
├── LEGAL_CHECKLIST.md      ← 이용약관 / 개인정보처리방침 체크리스트
├── ROADMAP.md              ← Week-by-week MVP 일정
│
├── package.json            ← Vite + React + TS + Supabase + Tailwind
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .env.example            ← 필요한 환경변수 목록
├── .gitignore
│
├── public/
│   └── fonts/              ← Galmuri11 픽셀 폰트 다운로드 안내
│
└── src/
    ├── main.tsx
    ├── App.tsx             ← 라우팅
    ├── index.css           ← Tailwind + 디자인 토큰
    │
    ├── lib/
    │   ├── supabase.ts     ← Supabase 클라이언트
    │   ├── kakao.ts        ← 카카오맵 SDK 래퍼
    │   └── auth.ts         ← OTP 로그인 헬퍼
    │
    ├── data/
    │   ├── regions.ts      ← 시/군/구 (전국)
    │   └── shop-types.ts   ← 매장 종류 정의
    │
    ├── types/
    │   └── index.ts        ← Shop, Post, Comment, User 등 타입
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useGeolocation.ts
    │   └── useShops.ts
    │
    ├── components/
    │   ├── ui/             ← 디자인 시스템 (PixelButton, Sprite, PixelBorder, ...)
    │   ├── shop/           ← 매장 카드, 핀, 스프라이트
    │   └── post/           ← 글 카드, 댓글
    │
    └── pages/
        ├── HomePage.tsx
        ├── MapPage.tsx
        ├── LocationSearchPage.tsx
        ├── PostPage.tsx
        ├── CommunityPage.tsx
        ├── PostDetailPage.tsx
        ├── LoginPage.tsx
        ├── ProfilePage.tsx
        └── AuthWallPage.tsx
```

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd handoff
npm install
```

### 2. 환경변수 설정
`.env.example` 을 `.env.local` 로 복사하고 채우기:
```bash
cp .env.example .env.local
```

필요한 키:
- `VITE_SUPABASE_URL` — Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_KAKAO_MAP_KEY` — 카카오 JavaScript 키 ([Kakao Developers](https://developers.kakao.com/))

### 3. Supabase 셋업
1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. SQL Editor → `supabase/schema.sql` 내용 전체 붙여넣기 → Run
3. Authentication → Providers → **Phone** 활성화
   - SMS Provider: **Twilio** (또는 **MessageBird**, 한국이면 **NHN Toast SMS** 게이트웨이도 가능)
   - 비용: Twilio 한국 SMS 약 $0.04/건

### 4. 카카오맵 API
- [카카오 개발자센터](https://developers.kakao.com) 가입 → 앱 생성 → JavaScript 키 발급
- 플랫폼 등록: 도메인에 `http://localhost:5173`, 배포 도메인 추가
- 자세한 통합 방법: `KAKAO_MAP_GUIDE.md` 참고

### 5. 시드 데이터
`CRAWLING_GUIDE.md` 참고해서 매장 100~200개 수집 → Supabase `shops` 테이블에 import

### 6. 개발 서버 실행
```bash
npm run dev
```

---

## 🧠 Lovable에서 사용하기

### 옵션 A: GitHub → Lovable
1. 이 프로젝트를 GitHub repo에 push
2. [lovable.dev](https://lovable.dev) → New Project → **Import from GitHub**
3. Lovable이 코드를 그대로 가져와서 편집 가능
4. Lovable의 Supabase 통합 활성화 → 환경변수가 자동으로 주입됨
5. 카카오맵 SDK는 `index.html`의 `<script>` 태그를 Lovable 채팅에 직접 요청해서 추가 (Lovable은 외부 SDK 잘 처리함)

### 옵션 B: Lovable에서 새로 만들고 코드 복사
1. Lovable에서 빈 Vite + React + Supabase 프로젝트 생성
2. `src/` 폴더의 코드를 Lovable 채팅에 붙여넣어서 한 화면씩 마이그레이션

### Lovable에서 카카오맵 사용 가능?
**네, 가능합니다.** Lovable은 임의의 외부 JavaScript SDK를 잘 통합합니다.
- `index.html` 에 SDK script 태그 추가
- `useEffect` 안에서 `window.kakao.maps` 사용
- 자세한 코드 패턴은 `KAKAO_MAP_GUIDE.md` 참고

---

## 🛠 개발 도구 추천

| 용도 | 도구 |
|---|---|
| 메인 IDE | Lovable (브라우저) 또는 Cursor (로컬) |
| GitHub 연동 | Lovable의 GitHub sync |
| Supabase 작업 | Supabase Dashboard SQL Editor |
| 매장 크롤링 | Python + Playwright (`CRAWLING_GUIDE.md`) |
| 디자인 참조 | `design-source/Pokemon Cards.html` (Design Canvas) |

---

## 📚 다음에 읽을 것

1. **`MVP_SPEC.md`** ← 화면별 동작이 전부 적혀 있음. 여기서부터 시작.
2. **`ROADMAP.md`** ← 어떤 순서로 작업할지
3. **`supabase/schema.sql`** ← DB 만들기
4. **`KAKAO_MAP_GUIDE.md`** ← 지도 붙이기

---

## ⚠️ 디자인 보존 원칙

핸드오프된 코드는 **디자인 캔버스의 픽셀 스타일을 1:1로 보존**합니다. 변경 시 주의:

- **Galmuri11** 픽셀 폰트는 한글 본문, **Press Start 2P** 는 영문 라벨에 사용 — 절대 다른 폰트로 바꾸지 말 것
- **2px 검정 보더 + 3px offset shadow** = 모든 버튼의 시그니처. 둥근 모서리 금지.
- **색 팔레트**: White (#FAFAF7) : Red (#E63946) : Black (#111) = 6:3:1 비율 유지
- **포켓몬 IP 직접 사용 금지**: '포켓몬'/'몬스터볼' 같은 단어는 카피에는 쓰되 로고/캐릭터 이미지는 사용 X

---

## 🆘 문제가 생기면

이 폴더의 각 .md 파일을 우선 확인:
- 빌드 안 됨 → `package.json`, `tsconfig.json` 확인
- DB 에러 → `supabase/schema.sql` 다시 실행
- 지도 안 뜸 → `KAKAO_MAP_GUIDE.md`의 troubleshooting 섹션
- 매장 데이터 부족 → `CRAWLING_GUIDE.md`
