# 매장 데이터 크롤링 가이드

> MVP 시작에 필요한 시드 데이터 100~200개 (서울 기준) 수집 전략. **법적/윤리적 한도 안에서**.

---

## 🎯 목표
- 서울 전역 카드샵 / 자판기 / 편의점 (포케카 취급) / 팝업 매장 **100~200개** 수집
- 컬럼: `name, type, addr, lat, lng, city, district, dong, phone, hours`

---

## 📊 데이터 소스 추천

### 1. 카드샵 (cardshop) — **가장 중요**

| 소스 | 방법 | 난이도 |
|---|---|---|
| **네이버 지도** "포켓몬 카드샵" 검색 | 검색 결과 스크롤 → JSON 응답 파싱 | 중 |
| **카카오맵** 키워드 검색 | `places.kakao.com` 또는 SDK의 `Places.keywordSearch` | 하 ⭐ |
| **인스타그램** 해시태그 #포켓몬카드샵 | 위치 태그 추출 | 상 |
| **루리웹/디시 카드매장 추천글** | 수동 정리 | 하 |
| **구글 검색** "지역명 + 포켓몬 카드샵" | 수동 큐레이션 | 하 |

#### ⭐ 카카오맵 Places API (추천)
```python
import requests, json, time

KAKAO_REST_KEY = "your-rest-key"  # JS 키 아님!
url = "https://dapi.kakao.com/v2/local/search/keyword.json"
headers = {"Authorization": f"KakaoAK {KAKAO_REST_KEY}"}

results = []
for district in ["강남구", "서초구", "마포구", ...]:
    for kw in ["포켓몬 카드샵", "TCG 카드샵", "트레이딩 카드"]:
        page = 1
        while True:
            r = requests.get(url, headers=headers, params={
                "query": f"{district} {kw}",
                "page": page,
                "size": 15,
            })
            data = r.json()
            results.extend(data["documents"])
            if data["meta"]["is_end"]: break
            page += 1
            time.sleep(0.3)  # rate limit

# CSV로 저장
import csv
with open("shops_seed.csv", "w") as f:
    w = csv.DictWriter(f, fieldnames=["name","addr","lat","lng","phone","place_url"])
    w.writeheader()
    for d in results:
        w.writerow({
            "name": d["place_name"],
            "addr": d["road_address_name"] or d["address_name"],
            "lat": d["y"], "lng": d["x"],
            "phone": d.get("phone",""),
            "place_url": d.get("place_url",""),
        })
```

> **주의**: 카카오 Places API는 **REST 키** 사용. JS 키와 다름. 일 30만 건 무료.

### 2. 자판기 (vending) — **수동 + 인스타**

포켓몬 카드 자판기는 카카오맵에 잘 안 나와요.
- **인스타그램** "#포켓몬자판기 #카드자판기" 위치 태그
- **트위터/X** 검색 "카드자판기"
- 트레이너 커뮤니티(루리웹, 디시) 자판기 위치 정보 글
- → **수동 큐레이션 50개 정도부터 시작**

### 3. 편의점 (cvs) — **공식 데이터**

GS25, CU, 세븐일레븐은 신상 박스 입고 매장 별도. 본사에서 입고 매장 리스트 안 줌.
- **대안**: 일단 `포케카 취급 편의점` 안 따로 분류하지 말고, 사용자가 글 쓸 때 매장 등록하게 함
- 또는 카드 박스 출시일에 신상 입고 보고된 편의점만 모아서 별도 리스트

### 4. 팝업 (popup)
- 포켓몬코리아 공식 SNS / 홈페이지 팝업스토어 공지
- 한정 운영이라 수시로 추가/삭제 → 관리자가 수동 관리

---

## 🤖 Crawling 스크립트 구조

```
scripts/
├── crawl_kakao.py           # 카카오 Places API
├── crawl_naver.py           # 네이버 지도 (옵션)
├── enrich_geocode.py        # 좌표 보정/누락 보충
├── normalize.py             # 시/구/동 추출, 중복 제거
└── upload_supabase.py       # supabase-py 로 일괄 INSERT
```

### upload_supabase.py 예시
```python
import csv, os
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

with open("shops_seed_clean.csv") as f:
    rows = list(csv.DictReader(f))

# batch insert (100개씩)
for i in range(0, len(rows), 100):
    chunk = rows[i:i+100]
    sb.table("shops").insert(chunk).execute()
```

> **service_role key** 사용 — RLS 우회. 절대 클라이언트에 노출 금지.

---

## ⚖ 법적/윤리적 가이드라인

### ✅ 해도 되는 것
- **공식 API** (카카오 Places, 네이버 지역검색): API 약관 준수하면 OK
- **공개된 정보** (매장 이름, 주소, 전화번호): 저작권 X
- **수동 수집**: 사람이 검색해서 정리

### ❌ 하면 안 되는 것
- 인스타그램 자동 스크래핑 (자동화 명시적 금지)
- 네이버 지도 페이지 HTML 자동 파싱 (서비스 약관 위반)
- robots.txt 무시한 크롤러
- 짧은 시간에 많은 요청 (서버 부담)

### 💡 best practice
- API 우선, 스크래핑 최후
- `time.sleep(0.5~1)` 으로 rate limit
- User-Agent에 본인 이메일 명시: `MyApp/1.0 (contact: you@example.com)`
- 매장 정보 출처 추적: `source` 컬럼 추가 (kakao/naver/manual/user)

---

## 🔁 지속적 수집 전략

MVP 출시 후:
1. **사용자 글 쓰기 = 자연스러운 데이터 확장**
   - "새 장소" 등록 시 user_id 기록 → 트레이너가 매장 채워줌
2. **관리자 검증 큐**
   - `verified=false` 매장은 관리자 페이지에서 검토
   - 같은 매장 중복 등록 → merge UI
3. **활동 없는 매장 정리**
   - 6개월 글 0건 + verified=false → archive
4. **클러스터링**
   - 가까운 매장 (50m 내) 자동 중복 의심 alert

---

## 🛠 추천 도구

| 작업 | 도구 |
|---|---|
| 카카오 Places API | `requests` (Python) |
| 데이터 정제 | `pandas` |
| 지오코딩 보정 | 카카오 Geocoder API |
| Supabase 업로드 | `supabase-py` |
| 시각화 (잘 분포됐나) | `folium` (지도에 핀 찍기) |

---

## 📌 시드 데이터 체크리스트

- [ ] 서울 25개 구 골고루 분포 (한 구당 최소 3개)
- [ ] 종류별 분포: 카드샵 60% / 자판기 20% / 편의점 15% / 팝업 5%
- [ ] 모든 매장 lat/lng 정상 (한국 영토 안)
- [ ] 중복 없음 (이름 + 주소 동일하면 dedup)
- [ ] 영업종료 매장 제거
- [ ] verified=true 표시 (관리자 검증 끝난 것만)
