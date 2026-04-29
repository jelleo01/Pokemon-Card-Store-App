// Shared shop data + small helpers used by both versions.

// Shop type categories (4 kinds, used as legend in INDEX + filter chips):
//   '공식'   — 공식 온라인 스토어 / 오프라인 매장
//   '자판기' — 카드 자판기
//   '편의점' — 편의점에서 카드팩 판매
//   '카드샵' — 개인 운영 카드샵
const SHOP_TYPES = ['공식', '자판기', '편의점', '카드샵'];

const SHOPS = [
  { id: 'PC-001', name: '카드월드 강남점',     dist: 0.3, type: '공식',   stock: '신상 박스 12개, 스타터 5종', stockLevel: 'High', newsCount: 3, x: 38, y: 42, hours: '11:00 – 22:00', addr: '강남구 역삼로 12',  update: '2026.04.28' },
  { id: 'PC-002', name: '몬볼 자판기 #14',     dist: 0.5, type: '자판기', stock: '랜덤팩 약 30개 추정',         stockLevel: 'Mid',  newsCount: 0, x: 56, y: 30, hours: '24시간',         addr: '강남역 6번 출구',   update: '2026.04.27' },
  { id: 'PC-003', name: 'GS25 역삼로점',       dist: 0.8, type: '편의점', stock: '부스터팩 잔여 4개',           stockLevel: 'Low',  newsCount: 1, x: 70, y: 56, hours: '24시간',         addr: '역삼동 998-3',      update: '2026.04.28' },
  { id: 'PC-004', name: '카드덕후 본점',       dist: 1.1, type: '카드샵', stock: '신상 박스, 싱글 카드 다수',   stockLevel: 'High', newsCount: 5, x: 22, y: 62, hours: '12:00 – 21:00', addr: '서초구 서초대로 88', update: '2026.04.28' },
  { id: 'PC-005', name: 'CU 테헤란점',         dist: 1.4, type: '편의점', stock: '부스터팩 잔여 8개',           stockLevel: 'Mid',  newsCount: 0, x: 48, y: 74, hours: '24시간',         addr: '테헤란로 211',      update: '2026.04.26' },
  { id: 'PC-006', name: '레어덱 카드샵',       dist: 1.9, type: '카드샵', stock: '구판 위주, 신상은 1박스',     stockLevel: 'Low',  newsCount: 2, x: 80, y: 28, hours: '10:00 – 19:00', addr: '논현동 45',         update: '2026.04.25' },
];

const COMMUNITY = [
  { id: 'q1', who: '트레이너#0421', loc: '강남구', dong: '역삼동', t: '카드월드 강남점에 신상 박스 들어왔어요!', body: '오늘 14시쯤 신상 박스 12개 입고됐습니다. 1인 2박스 제한이고, 5시까지는 절반 정도 남아있었어요. 가실 분들 참고하세요!', tag: '소식', mins: 4, hearts: 12, comments: [
    { who: '트레이너#0099', t: '감사해요! 지금 출발합니다 🏃', mins: 2 },
    { who: '트레이너#3311', t: '저도 다녀왔는데 아직 4박스 남아있었어요', mins: 1 },
  ]},
  { id: 'q2', who: '트레이너#1188', loc: '서초구', dong: '서초동', t: '자판기 #14 재고 다 떨어졌나요?', body: '오후에 가봤는데 LED가 꺼져있던데 재입고 언제쯤일까요?', tag: '질문', mins: 22, hearts: 3, comments: [
    { who: '트레이너#0421', t: '보통 화/금에 채운대요', mins: 18 },
  ]},
  { id: 'q3', who: '트레이너#0007', loc: '강남구', dong: '논현동', t: '오늘 카드덕후 본점 오픈런 성공!', body: '7시 30분에 도착했는데 5등이었어요. 신상 2박스 + 스타터 1개 겟!', tag: '소식', mins: 51, hearts: 28, comments: [] },
];

// 시 / 구 location filter tree (used in COMMUNITY 위치별)
const REGIONS = [
  { city: '서울', districts: ['강남구', '서초구', '송파구', '마포구', '용산구'] },
  { city: '경기', districts: ['성남시', '수원시', '고양시'] },
  { city: '부산', districts: ['해운대구', '부산진구'] },
];

window.SHOPS = SHOPS;
window.SHOP_TYPES = SHOP_TYPES;
window.COMMUNITY = COMMUNITY;
window.REGIONS = REGIONS;
