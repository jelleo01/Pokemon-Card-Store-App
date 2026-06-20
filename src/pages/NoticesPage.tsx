import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import BackButton from '@/components/ui/BackButton'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

interface Notice {
  id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
}

export default function NoticesPage() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    supabase
      .from('notices')
      .select('id, title, body, pinned, created_at')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!alive) return
        setLoading(false)
        if (error) {
          console.error('[notices]', error)
          setErr(error.message)
          return
        }
        setNotices((data ?? []) as Notice[])
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        fontFamily: gbStyles.font,
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackButton onClick={() => navigate(-1)} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            NOTICES
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--ink-2)',
            }}
          >
            불러오는 중...
          </div>
        ) : err ? (
          <div
            style={{
              padding: '10px 12px',
              border: '2px solid var(--red)',
              background: '#FCE7E7',
              color: 'var(--red)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ✕ {err}
          </div>
        ) : notices.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--ink-2)',
              lineHeight: 1.6,
            }}
          >
            아직 공지사항이 없어요.
          </div>
        ) : (
          notices.map((n) => (
            <PixelBorder
              key={n.id}
              color="#111"
              bg={n.pinned ? 'var(--paper-2)' : 'var(--paper)'}
              padding={12}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                {n.pinned && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      border: '2px solid #111',
                      background: 'var(--red)',
                      color: '#FAFAF7',
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    ★ 고정
                  </span>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{n.title}</div>
                <div
                  style={{
                    fontSize: 9,
                    opacity: 0.5,
                    fontFamily: gbStyles.fontEn,
                  }}
                >
                  {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: 'var(--ink-2)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {n.body}
              </div>
            </PixelBorder>
          ))
        )}
      </div>
    </div>
  )
}
