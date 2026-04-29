// Shared shop data + small helpers used across all screens.
// Mirrors data.jsx — ported to TypeScript.

export type ShopType = '공식' | '자판기' | '편의점' | '카드샵'
export type StockLevel = 'High' | 'Mid' | 'Low'

export interface Shop {
  id: string
  name: string
  dist: number
  type: ShopType
  stock: string
  stockLevel: StockLevel
  newsCount: number
  x: number
  y: number
  lat: number
  lng: number
  hours: string
  addr: string
  update: string
}

export interface Comment {
  who: string
  t: string
  mins: number
}

export interface Post {
  id: string
  who: string
  loc: string
  dong: string
  t: string
  body: string
  tag: '소식' | '질문'
  mins: number
  hearts: number
  comments: Comment[]
}

export interface Region {
  city: string
  districts: string[]
}

import { SEED_SHOPS } from './seedShops'

export const SHOP_TYPES: ShopType[] = ['공식', '자판기', '편의점', '카드샵']

const MOCK_SHOPS: Shop[] = [
  { id: 'PC-001', name: '카드월드 강남점',     dist: 0.3, type: '공식',   stock: '신상 박스 12개, 스타터 5종', stockLevel: 'High', newsCount: 3, x: 38, y: 42, lat: 37.5009, lng: 127.0367, hours: '11:00 – 22:00', addr: '강남구 역삼로 12',  update: '2026.04.28' },
  { id: 'PC-002', name: '몬볼 자판기 #14',     dist: 0.5, type: '자판기', stock: '랜덤팩 약 30개 추정',         stockLevel: 'Mid',  newsCount: 0, x: 56, y: 30, lat: 37.4979, lng: 127.0276, hours: '24시간',         addr: '강남역 6번 출구',   update: '2026.04.27' },
  { id: 'PC-003', name: 'GS25 역삼로점',       dist: 0.8, type: '편의점', stock: '부스터팩 잔여 4개',           stockLevel: 'Low',  newsCount: 1, x: 70, y: 56, lat: 37.5005, lng: 127.0420, hours: '24시간',         addr: '역삼동 998-3',      update: '2026.04.28' },
  { id: 'PC-004', name: '카드덕후 본점',       dist: 1.1, type: '카드샵', stock: '신상 박스, 싱글 카드 다수',   stockLevel: 'High', newsCount: 5, x: 22, y: 62, lat: 37.4948, lng: 127.0267, hours: '12:00 – 21:00', addr: '서초구 서초대로 88', update: '2026.04.28' },
  { id: 'PC-005', name: 'CU 테헤란점',         dist: 1.4, type: '편의점', stock: '부스터팩 잔여 8개',           stockLevel: 'Mid',  newsCount: 0, x: 48, y: 74, lat: 37.5048, lng: 127.0500, hours: '24시간',         addr: '테헤란로 211',      update: '2026.04.26' },
  { id: 'PC-006', name: '레어덱 카드샵',       dist: 1.9, type: '카드샵', stock: '구판 위주, 신상은 1박스',     stockLevel: 'Low',  newsCount: 2, x: 80, y: 28, lat: 37.5101, lng: 127.0395, hours: '10:00 – 19:00', addr: '논현동 45',         update: '2026.04.25' },
]

// 크롤링한 seed가 있으면 그것을, 없으면 mock 6개 사용 (개발 fallback)
export const SHOPS: Shop[] = SEED_SHOPS.length > 0 ? SEED_SHOPS : MOCK_SHOPS

export const COMMUNITY: Post[] = [
  { id: 'q1', who: '트레이너#0421', loc: '강남구', dong: '역삼동', t: '카드월드 강남점에 신상 박스 들어왔어요!', body: '오늘 14시쯤 신상 박스 12개 입고됐습니다. 1인 2박스 제한이고, 5시까지는 절반 정도 남아있었어요. 가실 분들 참고하세요!', tag: '소식', mins: 4, hearts: 12, comments: [
    { who: '트레이너#0099', t: '감사해요! 지금 출발합니다 🏃', mins: 2 },
    { who: '트레이너#3311', t: '저도 다녀왔는데 아직 4박스 남아있었어요', mins: 1 },
  ]},
  { id: 'q2', who: '트레이너#1188', loc: '서초구', dong: '서초동', t: '자판기 #14 재고 다 떨어졌나요?', body: '오후에 가봤는데 LED가 꺼져있던데 재입고 언제쯤일까요?', tag: '질문', mins: 22, hearts: 3, comments: [
    { who: '트레이너#0421', t: '보통 화/금에 채운대요', mins: 18 },
  ]},
  { id: 'q3', who: '트레이너#0007', loc: '강남구', dong: '논현동', t: '오늘 카드덕후 본점 오픈런 성공!', body: '7시 30분에 도착했는데 5등이었어요. 신상 2박스 + 스타터 1개 겟!', tag: '소식', mins: 51, hearts: 28, comments: [] },
]

// 전국 행정구역 — 17개 광역시도 + 기초자치단체.
// 행정안전부 기준 2024년 행정구역. 군위군(2023.7 경북→대구 편입) 반영.
// 세종특별자치시는 기초자치단체 없음 → 단일 'districts: []' 처리.
export const REGIONS: Region[] = [
  {
    city: '서울',
    districts: [
      '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
      '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
      '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
    ],
  },
  {
    city: '부산',
    districts: [
      '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구',
      '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구',
    ],
  },
  {
    city: '대구',
    districts: ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
  },
  {
    city: '인천',
    districts: ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  },
  { city: '광주', districts: ['광산구', '남구', '동구', '북구', '서구'] },
  { city: '대전', districts: ['대덕구', '동구', '서구', '유성구', '중구'] },
  { city: '울산', districts: ['남구', '동구', '북구', '울주군', '중구'] },
  { city: '세종', districts: [] },
  {
    city: '경기',
    districts: [
      '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
      '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
      '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
      '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시',
    ],
  },
  {
    city: '강원',
    districts: [
      '강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군',
      '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군',
      '화천군', '횡성군',
    ],
  },
  {
    city: '충북',
    districts: [
      '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군',
      '진천군', '청주시', '충주시',
    ],
  },
  {
    city: '충남',
    districts: [
      '계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시',
      '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군',
    ],
  },
  {
    city: '전북',
    districts: [
      '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시',
      '임실군', '장수군', '전주시', '정읍시', '진안군',
    ],
  },
  {
    city: '전남',
    districts: [
      '강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시',
      '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군',
      '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군',
    ],
  },
  {
    city: '경북',
    districts: [
      '경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시',
      '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군',
      '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시',
    ],
  },
  {
    city: '경남',
    districts: [
      '거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군',
      '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군',
      '함양군', '합천군',
    ],
  },
  { city: '제주', districts: ['서귀포시', '제주시'] },
]
