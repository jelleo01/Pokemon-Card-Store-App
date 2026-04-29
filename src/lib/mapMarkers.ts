// HTML string serializers for Kakao CustomOverlay content. Mirrors the
// JSX pixel pins exactly (TypePin SVG + 매장명 박스, 내 위치, NEW 핀).
//
// Click handling is by delegation: each pin embeds data-shop-id and the
// KakaoMap container div listens for clicks at the root.

import type { Shop, ShopType } from '@/lib/data'

const FONT = "'Galmuri11', 'Geist', ui-monospace, monospace"

// TypePin — must stay byte-identical to src/components/ui/TypePin.tsx
export function typePinSvg(type: ShopType, size: number, active: boolean): string {
  const fg = active ? '#FAFAF7' : '#111'
  const bg = active ? '#111' : '#FAFAF7'
  const accent = '#E63946'
  const open = `<svg width="${size}" height="${size}" viewBox="0 0 10 10" shape-rendering="crispEdges">`
  const close = `</svg>`

  if (type === '공식') {
    return (
      open +
      `<rect x="0" y="0" width="10" height="10" fill="${fg}"/>` +
      `<rect x="1" y="1" width="8" height="8" fill="${accent}"/>` +
      `<rect x="3" y="3" width="4" height="4" fill="${bg}"/>` +
      close
    )
  }
  if (type === '자판기') {
    return (
      open +
      `<rect x="1" y="0" width="8" height="10" fill="${fg}"/>` +
      `<rect x="2" y="1" width="6" height="3" fill="${accent}"/>` +
      `<rect x="2" y="5" width="6" height="1" fill="${bg}"/>` +
      `<rect x="2" y="7" width="6" height="1" fill="${bg}"/>` +
      close
    )
  }
  if (type === '편의점') {
    return (
      open +
      `<rect x="0" y="2" width="10" height="6" fill="${fg}"/>` +
      `<rect x="1" y="3" width="8" height="4" fill="${bg}"/>` +
      `<rect x="0" y="1" width="10" height="1" fill="${accent}"/>` +
      close
    )
  }
  // 카드샵
  return (
    open +
    `<rect x="2" y="0" width="6" height="10" fill="${fg}"/>` +
    `<rect x="3" y="1" width="4" height="3" fill="${accent}"/>` +
    `<rect x="3" y="5" width="4" height="1" fill="${bg}"/>` +
    `<rect x="3" y="7" width="3" height="1" fill="${bg}"/>` +
    close
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

// Shop pin — 분류 아이콘만 (매장명 X). 선택 상태일 때만 매장명 박스 추가.
// 220+개 매장이 다 매장명을 표시하면 빽빽하므로 INDEX 아이콘 중심으로 단순화.
export function shopPinHtml(shop: Shop, active: boolean): string {
  if (active) {
    // 선택된 핀 — TypePin + 매장명 + 검정 강조
    const label = escapeHtml(shop.name.length > 14 ? shop.name.slice(0, 14) + '…' : shop.name)
    return (
      `<div data-shop-id="${shop.id}" style="` +
      `padding:3px 6px;` +
      `background:#111;color:#FAFAF7;` +
      `border:2px solid #111;` +
      `font-family:${FONT};font-size:10px;font-weight:700;` +
      `white-space:nowrap;` +
      `box-shadow:3px 3px 0 0 #111;` +
      `display:flex;align-items:center;gap:4px;` +
      `cursor:pointer;` +
      `transform:translateY(-100%);` +
      `z-index:10;position:relative;` +
      `">` +
      typePinSvg(shop.type, 12, true) +
      `<span>${label}</span>` +
      `</div>`
    )
  }
  // 일반 핀 — TypePin 아이콘만 (작은 흰 박스)
  return (
    `<div data-shop-id="${shop.id}" style="` +
    `width:20px;height:20px;` +
    `background:#FAFAF7;` +
    `border:2px solid #111;` +
    `box-shadow:2px 2px 0 0 #111;` +
    `display:flex;align-items:center;justify-content:center;` +
    `cursor:pointer;` +
    `transform:translateY(-100%);` +
    `">` +
    typePinSvg(shop.type, 12, false) +
    `</div>`
  )
}

// 내 위치 marker — 파란 박스 + label. 클릭 가능 (data-me="1")
export function mePinHtml(): string {
  return (
    `<div data-me="1" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">` +
    `<div data-me="1" style="width:14px;height:14px;background:#1E88FF;border:2px solid #111;box-shadow:0 0 0 4px rgba(30,136,255,0.25);"></div>` +
    `<div data-me="1" style="margin-top:2px;font-family:${FONT};font-size:9px;font-weight:700;padding:1px 4px;background:#FAFAF7;border:2px solid #111;white-space:nowrap;">내 위치</div>` +
    `</div>`
  )
}

// NEW marker for PostPage new-place mode
export function newPinHtml(): string {
  return (
    `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">` +
    `<div style="width:14px;height:14px;background:#E63946;border:2px solid #111;box-shadow:0 0 0 4px rgba(230,57,70,0.25);"></div>` +
    `<div style="margin-top:2px;font-family:${FONT};font-size:9px;font-weight:700;padding:1px 4px;background:#FAFAF7;border:2px solid #111;white-space:nowrap;">NEW</div>` +
    `</div>`
  )
}

// Selected-shop simple label pin (used as PostPage existing-mode marker)
export function selectedShopPinHtml(shop: Shop): string {
  const label = escapeHtml(shop.name.split(' ')[0])
  return (
    `<div style="` +
    `padding:2px 4px;background:#111;color:#FAFAF7;` +
    `border:2px solid #111;` +
    `font-family:${FONT};font-size:9px;font-weight:700;` +
    `box-shadow:2px 2px 0 0 #111;` +
    `transform:translateY(-100%);` +
    `">${label}</div>`
  )
}
