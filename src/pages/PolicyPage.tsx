import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import BackButton from '@/components/ui/BackButton'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

type Tab = 'terms' | 'privacy'

export default function PolicyPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('terms')
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    supabase
      .from('app_meta')
      .select('key, value')
      .in('key', ['terms', 'privacy'])
      .then(({ data, error }) => {
        if (!alive) return
        setLoading(false)
        if (error) {
          console.error('[policy]', error)
          return
        }
        for (const r of (data ?? []) as { key: string; value: string }[]) {
          if (r.key === 'terms') setTerms(r.value)
          if (r.key === 'privacy') setPrivacy(r.value)
        }
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
          padding: '12px 14px 8px',
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
            POLICY
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        {(
          [
            { id: 'terms', label: '이용약관', en: 'TERMS' },
            { id: 'privacy', label: '개인정보', en: 'PRIVACY' },
          ] as { id: Tab; label: string; en: string }[]
        ).map((t, i, a) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                cursor: 'pointer',
                border: 'none',
                borderRight: i === a.length - 1 ? 'none' : '2px solid #111',
                background: on ? '#111' : 'transparent',
                color: on ? '#FAFAF7' : '#111',
                fontFamily: gbStyles.font,
                fontSize: 11,
                letterSpacing: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>{t.label}</span>
              <span
                style={{
                  fontSize: 8,
                  opacity: 0.6,
                  fontFamily: gbStyles.fontEn,
                  letterSpacing: 2,
                }}
              >
                {t.en}
              </span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
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
        ) : (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={14}>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                color: 'var(--ink)',
              }}
            >
              {tab === 'terms' ? terms || '약관이 등록되지 않았어요.' : privacy || '개인정보 처리방침이 등록되지 않았어요.'}
            </div>
          </PixelBorder>
        )}
      </div>
    </div>
  )
}
