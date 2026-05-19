// Game Boy / pixel-style shared style tokens.
// Mirrors gbStyles + dither in version-gameboy.jsx.

import type { CSSProperties } from 'react'

export const gbStyles = {
  // 기본 한국어 — 가독성 폰트로 통일 (구 Galmuri pixel 에서 전환됨).
  // 앱 전반의 버튼/본문/라벨이 모두 이 토큰을 쓰므로 여기 한 곳만 바꾸면 캐스케이드.
  font: "'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, -apple-system, sans-serif",
  // 영문 우선 — 페이지 상단 타이틀(HOME / POST / POKEMON CARDS) 같이 retro 느낌 유지하고 싶은 곳에.
  // 한글이 떨어지면 Pretendard 로 가독성 폰트 fallback (Galmuri pixel 아님 — 한글 chip/timestamp 도 깔끔하게).
  fontEn:
    "'Geist', 'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif",
  // fontReadable — font 와 동일 (의미적 alias, 새 코드에서 명시적으로 쓰고 싶을 때).
  fontReadable:
    "'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, -apple-system, sans-serif",
  // 픽셀 — Galmuri11. 명시적으로 픽셀 느낌이 필요한 곳에만.
  fontPixel: "'Galmuri11', 'Geist', ui-monospace, monospace",
}

export const dither: CSSProperties = {
  background:
    'repeating-linear-gradient(45deg, rgba(17,17,17,0.10) 0 2px, transparent 2px 4px), var(--paper)',
}
