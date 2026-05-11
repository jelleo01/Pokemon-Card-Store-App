// Game Boy / pixel-style shared style tokens.
// Mirrors gbStyles + dither in version-gameboy.jsx.

import type { CSSProperties } from 'react'

export const gbStyles = {
  // Pixel/GameBoy 느낌 — 헤더, 버튼, 라벨 등 UI chrome 에 사용
  font: "'Galmuri11', 'Geist', ui-monospace, monospace",
  fontEn: "'Geist', 'Galmuri11', ui-monospace, monospace",
  // 가독성 우선 — 글 본문, 매장명/주소, 댓글 등 사용자 입력 콘텐츠에 사용
  fontReadable:
    "'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, -apple-system, sans-serif",
}

export const dither: CSSProperties = {
  background:
    'repeating-linear-gradient(45deg, rgba(17,17,17,0.10) 0 2px, transparent 2px 4px), var(--paper)',
}
