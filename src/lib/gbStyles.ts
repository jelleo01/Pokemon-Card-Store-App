// Game Boy / pixel-style shared style tokens.
// Mirrors gbStyles + dither in version-gameboy.jsx.

import type { CSSProperties } from 'react'

export const gbStyles = {
  font: "'Galmuri11', 'Geist', ui-monospace, monospace",
  fontEn: "'Geist', 'Galmuri11', ui-monospace, monospace",
}

export const dither: CSSProperties = {
  background:
    'repeating-linear-gradient(45deg, rgba(17,17,17,0.10) 0 2px, transparent 2px 4px), var(--paper)',
}
