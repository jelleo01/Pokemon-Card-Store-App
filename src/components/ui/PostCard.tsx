import type { Post } from '@/lib/data'
import PixelBorder from './PixelBorder'
import { gbStyles } from '@/lib/gbStyles'

function fmtMins(n: number): string {
  if (n < 1) return '방금'
  if (n < 60) return `${n}분 전`
  const h = Math.round(n / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.round(n / 1440)
  if (d < 30) return `${d}일 전`
  const mo = Math.round(n / (30 * 1440))
  if (mo < 12) return `${mo}달 전`
  return `${Math.round(n / (365 * 1440))}년 전`
}

interface PostCardProps {
  p: Post
  compact?: boolean
  onClick?: () => void
}

export default function PostCard({ p, compact, onClick }: PostCardProps) {
  const isAsk = p.tag === '질문'
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <PixelBorder color="#111" bg={compact ? 'var(--paper-2)' : 'var(--paper)'} padding={0}>
        <div style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                border: '2px solid #111',
                background: isAsk ? 'var(--paper)' : 'var(--red)',
                color: isAsk ? '#111' : '#FAFAF7',
                letterSpacing: 0.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {isAsk ? '? 질문' : '★ 소식'}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {p.loc}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 10,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {fmtMins(p.mins)}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.55,
              marginBottom: 4,
              fontFamily: gbStyles.fontReadable,
            }}
          >
            {p.t}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
              color: 'var(--ink-2)',
              fontFamily: gbStyles.fontReadable,
            }}
          >
            <span>by {p.who}</span>
            <div style={{ flex: 1 }} />
            <span>♡ {p.hearts || 0}</span>
            <span>💬 {p.comments?.length || 0}</span>
          </div>
        </div>
      </PixelBorder>
    </button>
  )
}
