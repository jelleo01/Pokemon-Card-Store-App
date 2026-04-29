import type { Post } from '@/lib/data'
import PixelBorder from './PixelBorder'
import { gbStyles } from '@/lib/gbStyles'

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
                fontSize: 9,
                padding: '1px 5px',
                border: '2px solid #111',
                background: isAsk ? 'var(--paper)' : 'var(--red)',
                color: isAsk ? '#111' : '#FAFAF7',
                letterSpacing: 1,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {isAsk ? '? 질문' : '★ 소식'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>{p.loc}</span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 9,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontEn,
                letterSpacing: 1,
              }}
            >
              {p.mins}m
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
            {p.t}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 10,
              color: 'var(--ink-2)',
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
