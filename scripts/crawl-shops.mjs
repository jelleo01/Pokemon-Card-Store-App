#!/usr/bin/env node
// 포켓몬 카드 판매처 크롤러.
// 소스 우선순위:
//   1. 포켓몬코리아 공식 자판기 리스트 (venderlist.json) — 178개+, 좌표 포함
//   2. 카카오 Places API — 개인 카드샵 보강
//
// 결과는 src/lib/seedShops.ts 에 자동 생성.
//
// 사용법:  npm run crawl-shops
// 요구사항:
//   - .env.local 의 KAKAO_REST_API_KEY (VITE_ prefix 없음)
//   - Node 20.6+ (--env-file 지원)

import { writeFile } from 'node:fs/promises'
import process from 'node:process'

const REST = process.env.KAKAO_REST_API_KEY
if (!REST) {
  console.error('❌ KAKAO_REST_API_KEY 가 .env.local 에 없어요.')
  console.error('   .env.local 에 VITE_ prefix 없이 추가하세요:')
  console.error('   KAKAO_REST_API_KEY=발급받은_REST_API_키')
  process.exit(1)
}

const VENDING_URL = 'https://calendar-1ut.pages.dev/scripts/venderlist.json'

// 공식 카드샵 11개 — pokemonkorea.co.kr/pokemon_cardshop 페이지에서 추출한 menu IDs
const OFFICIAL_CARDSHOP_MENUS = [
  { id: 329, region: '용산' },
  { id: 178, region: '역삼' },
  { id: 193, region: '수원' },
  { id: 202, region: '원주' },
  { id: 211, region: '인천' },
  { id: 213, region: '광주' },
  { id: 214, region: '평택' },
  { id: 226, region: '울산' },
  { id: 246, region: '대구' },
  { id: 661, region: '부산' },
  { id: 749, region: '대전' },
]

// ─── 카카오 Places 검색 — 카드샵/공식 매장 보강 ─────────────
const KAKAO_QUERIES = [
  '포켓몬 카드',
  '포켓몬카드',
  '포켓몬 스토어',
  '포켓몬코리아',
  '트레이딩카드',
  'TCG 샵',
  'TCG 매장',
  '카드 게임샵',
]

// 서울 25개 구 + 광역시/도청 소재지 + 경기 주요시 — 카카오 keyword API 정확도 위해 지역명 prefix 사용
const KAKAO_REGIONS = [
  // 서울 25개 구
  '서울 강남구', '서울 강동구', '서울 강북구', '서울 강서구', '서울 관악구',
  '서울 광진구', '서울 구로구', '서울 금천구', '서울 노원구', '서울 도봉구',
  '서울 동대문구', '서울 동작구', '서울 마포구', '서울 서대문구', '서울 서초구',
  '서울 성동구', '서울 성북구', '서울 송파구', '서울 양천구', '서울 영등포구',
  '서울 용산구', '서울 은평구', '서울 종로구', '서울 중구', '서울 중랑구',
  // 광역시
  '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  // 경기 주요
  '수원', '성남', '고양', '용인', '안양', '안산', '부천', '남양주', '평택',
  '의정부', '시흥', '파주', '광명', '김포', '광주시', '화성',
  // 강원
  '춘천', '원주', '강릉', '속초',
  // 충청
  '청주', '천안', '아산', '충주', '서산',
  // 전라
  '전주', '익산', '군산', '광양', '여수', '목포', '순천',
  // 경상
  '포항', '경주', '구미', '안동', '창원', '김해', '진주',
  // 제주
  '제주', '서귀포',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchOfficialVending() {
  console.log('📦 포켓몬 공식 자판기 리스트 받는 중...')
  const res = await fetch(VENDING_URL)
  if (!res.ok) throw new Error(`venderlist.json HTTP ${res.status}`)
  const list = await res.json()
  console.log(`✓ 공식 자판기 ${list.length}개 수신`)
  return list
}

// 공식 카드샵 — pokemonkorea.co.kr/pokemon_cardshop/menuXXX 에서
// 정식 매장명 추출 → 카카오 Places로 좌표/주소 매칭.
async function fetchOfficialCardshops() {
  console.log(`\n🏪 공식 카드샵 ${OFFICIAL_CARDSHOP_MENUS.length}개 매장 정보 수집...`)
  const out = []
  for (const m of OFFICIAL_CARDSHOP_MENUS) {
    const url = `https://pokemonkorea.co.kr/pokemon_cardshop/menu${m.id}`
    let name = `포켓몬 카드샵 ${m.region}점`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await res.text()
      const match = html.match(/tx-deco[^>]*>([^<]+)<\/p>/)
      if (match) name = match[1].trim()
    } catch (err) {
      console.warn(`  ⚠ menu${m.id} HTML fetch 실패:`, err.message)
    }

    // 카카오 Places 다단계 검색 — 풀네임 → prefix 제거 → 브랜드명만 → 지역만
    // 풀네임: "포켓몬 카드샵 카드냥 역삼" — 카카오는 너무 길면 매칭 실패
    // 시도 순서대로 첫 hit 사용
    const stripped = name.replace(/^포켓몬\s*카드샵\s*/, '').replace(/^포켓몬카드샵\s*/, '')
    // 브랜드명만 추출: "카드냥 역삼" → "카드냥"
    const brandOnly = stripped.replace(new RegExp(`\\s*${m.region}.*$`), '').trim()

    const tries = [
      name,                              // 1. 풀네임
      stripped,                          // 2. "포켓몬 카드샵" 제거
      `${brandOnly} ${m.region}`,        // 3. "카드냥 역삼"
      `${m.region} ${brandOnly}`,        // 4. "역삼 카드냥"
      brandOnly,                         // 5. 브랜드명만 "카드냥"
      `포켓몬 ${m.region}`,              // 6. "포켓몬 역삼"
    ]

    let hit = null
    let usedQuery = null
    for (const q of tries) {
      if (!q || q.length < 2) continue
      const r = await searchKakao(q, 1)
      const first = r.documents?.[0]
      if (first) {
        hit = first
        usedQuery = q
        break
      }
      await sleep(110)
    }

    if (hit) {
      out.push({
        // 매장명은 공식 페이지의 원본 이름 사용 (카카오 결과명 아님)
        name,
        addr: hit.road_address_name || hit.address_name || '',
        lat: parseFloat(hit.y),
        lng: parseFloat(hit.x),
      })
      const tag = usedQuery === name ? '' : ` [${usedQuery}]`
      console.log(`  ✓ ${m.region.padEnd(4)} → ${name}${tag}`)
    } else {
      console.warn(`  ⚠ ${m.region}: 카카오 매칭 실패 (${name})`)
    }
    await sleep(120)
  }
  return out
}

async function searchKakao(query, page = 1) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15&page=${page}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${REST}` },
  })
  if (!res.ok) {
    console.warn(`  ⚠ ${query} p${page}: HTTP ${res.status}`)
    return { documents: [], meta: { is_end: true } }
  }
  return res.json()
}

// 카카오 결과의 분류 추정 + TCG 노이즈 필터
function isLikelyTcgShop(doc) {
  const name = (doc.place_name || '').toLowerCase()
  const cat = (doc.category_name || '').toLowerCase()
  // 카드 외 다른 의미 (명함/신용카드/SD카드/카드키 등)는 제외
  if (
    cat.includes('명함') ||
    cat.includes('신용카드') ||
    cat.includes('체크카드') ||
    cat.includes('카드키') ||
    cat.includes('금융') ||
    cat.includes('데이터복구')
  )
    return false
  if (
    name.includes('명함') ||
    name.includes('카드결제') ||
    name.includes('카드회사') ||
    name.includes('신용카드') ||
    name.includes('sd카드') ||
    name.includes('카드복구') ||
    name.includes('아이스크림') ||
    name.includes('포스트카드') ||
    name.includes('카드복권')
  )
    return false
  // 긍정 시그널: 매장명에 포켓몬/tcg/트레이딩/카드샵/카드 게임 등
  const positive =
    name.includes('포켓몬') ||
    name.includes('tcg') ||
    name.includes('트레이딩') ||
    name.includes('카드샵') ||
    name.includes('카드 샵') ||
    name.includes('카드 게임') ||
    name.includes('카드게임') ||
    name.includes('완구') ||
    name.includes('문구') ||
    name.includes('보드게임')
  return positive
}

function classifyKakao(doc) {
  const name = (doc.place_name || '').toLowerCase()
  if (name.includes('자판기')) return '자판기'
  if (name.includes('포켓몬코리아') || name.includes('포켓몬 스토어') || name.includes('포켓몬스토어'))
    return '공식'
  return '카드샵'
}

// 자판기 brand → 매장명에서 분류 (자판기 자체는 모두 '자판기' 분류)
// 하지만 우리 앱의 "공식" 분류는 포켓몬 공식 매장만이라 자판기는 모두 '자판기'로 둠.

async function crawlKakao() {
  console.log(`\n🔍 카카오 Places — ${KAKAO_REGIONS.length}개 지역 × ${KAKAO_QUERIES.length}개 검색어`)
  const map = new Map() // dedupe by id
  let req = 0
  for (const region of KAKAO_REGIONS) {
    const before = map.size
    for (const q of KAKAO_QUERIES) {
      const query = `${region} ${q}`
      for (let page = 1; page <= 3; page++) {
        req++
        const data = await searchKakao(query, page)
        for (const d of data.documents || []) {
          if (!map.has(d.id) && isLikelyTcgShop(d)) {
            map.set(d.id, d)
          }
        }
        await sleep(110)
        if (data.meta?.is_end) break
      }
    }
    const added = map.size - before
    console.log(`  ${region.padEnd(12)} +${String(added).padStart(2)}  (누적 ${map.size}, 요청 ${req})`)
  }
  return [...map.values()]
}

function normalizeAddr(addr) {
  // dedupe key 용 — 공백/구두점 제거 후 lowercase
  return (addr || '').replace(/\s+/g, '').toLowerCase()
}

async function main() {
  // 1. 공식 자판기 (178개)
  const vending = await fetchOfficialVending()
  // 2. 공식 카드샵 (11개)
  const officialShops = await fetchOfficialCardshops()
  // 3. 카카오 보강 (개인 카드샵)
  const kakao = await crawlKakao()

  // 4. 통합 + dedupe (주소+이름 기준)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  const seenAddr = new Set()
  const shops = []
  let i = 1

  // 공식 카드샵 — 가장 먼저 (가장 신뢰)
  for (const o of officialShops) {
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) continue
    const key = normalizeAddr(o.addr) + '|' + o.name
    if (seenAddr.has(key)) continue
    seenAddr.add(key)
    shops.push({
      id: `PC-${String(i).padStart(4, '0')}`,
      name: o.name,
      dist: 0,
      type: '공식',
      stock: '포켓몬 공식 카드샵',
      stockLevel: 'High',
      newsCount: 0,
      x: 0,
      y: 0,
      lat: o.lat,
      lng: o.lng,
      hours: '문의',
      addr: o.addr,
      update: today,
    })
    i++
  }

  // 공식 자판기
  for (const v of vending) {
    const lat = parseFloat(v.lat)
    const lng = parseFloat(v.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const key = normalizeAddr(v.addr) + '|' + v.name
    if (seenAddr.has(key)) continue
    seenAddr.add(key)
    shops.push({
      id: `PC-${String(i).padStart(4, '0')}`,
      name: v.name,
      dist: 0,
      type: '자판기',
      stock: '카드팩 자판기',
      stockLevel: 'Mid',
      newsCount: 0,
      x: 0,
      y: 0,
      lat,
      lng,
      hours: v.kind === 'cinema' ? '영화관 운영시간' : v.kind === 'mart' ? '마트 운영시간' : '문의',
      addr: v.addr || '',
      update: today,
    })
    i++
  }

  // 카카오 매장 (자판기 외)
  for (const d of kakao) {
    const lat = parseFloat(d.y)
    const lng = parseFloat(d.x)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const addr = d.road_address_name || d.address_name || ''
    const key = normalizeAddr(addr) + '|' + d.place_name
    if (seenAddr.has(key)) continue
    seenAddr.add(key)
    shops.push({
      id: `PC-${String(i).padStart(4, '0')}`,
      name: d.place_name,
      dist: 0,
      type: classifyKakao(d),
      stock: '정보 없음',
      stockLevel: 'Mid',
      newsCount: 0,
      x: 0,
      y: 0,
      lat,
      lng,
      hours: '문의',
      addr,
      update: today,
    })
    i++
  }

  // 4. seedShops.ts 출력
  const ts =
    `// AUTO-GENERATED by scripts/crawl-shops.mjs — DO NOT EDIT.\n` +
    `// Run \`npm run crawl-shops\` to regenerate.\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `// Total shops: ${shops.length}\n\n` +
    `import type { Shop } from './data'\n\n` +
    `export const SEED_SHOPS: Shop[] = ${JSON.stringify(shops, null, 2)}\n`
  await writeFile('src/lib/seedShops.ts', ts, 'utf-8')

  console.log(`\n✅ ${shops.length}개 매장 → src/lib/seedShops.ts`)

  const byType = {}
  for (const s of shops) byType[s.type] = (byType[s.type] || 0) + 1
  console.log('\n📊 분류별:')
  for (const [t, n] of Object.entries(byType)) console.log(`   ${t}: ${n}`)

  console.log('\n📍 샘플 (각 분류 첫 매장):')
  for (const t of ['공식', '자판기', '편의점', '카드샵']) {
    const first = shops.find((s) => s.type === t)
    if (first) console.log(`   [${t}] ${first.name} (${first.addr})`)
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
