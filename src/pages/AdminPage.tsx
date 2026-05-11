import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

type Tab = 'notices' | 'inquiries' | 'meta'

interface Notice {
  id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
}

interface Inquiry {
  id: string
  user_id: string | null
  subject: string
  body: string
  contact: string | null
  status: string
  admin_note: string | null
  created_at: string
  resolved_at: string | null
}

interface MetaRow {
  key: string
  value: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('notices')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!user.isAdmin) {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  if (!user?.isAdmin) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: gbStyles.font,
          color: 'var(--ink-2)',
        }}
      >
        권한 확인 중...
      </div>
    )
  }

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
          <BackButton onClick={() => navigate('/profile')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            ADMIN
          </div>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 9,
              padding: '2px 6px',
              border: '2px solid #111',
              background: 'var(--red)',
              color: '#FAFAF7',
              fontFamily: gbStyles.fontEn,
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            ★ {user.trainerId}
          </span>
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
            { id: 'notices', label: '공지', en: 'NOTICES' },
            { id: 'inquiries', label: '문의', en: 'INQUIRIES' },
            { id: 'meta', label: '메타', en: 'META' },
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
        {tab === 'notices' && <NoticesAdmin />}
        {tab === 'inquiries' && <InquiriesAdmin />}
        {tab === 'meta' && <MetaAdmin />}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// 공지사항 관리
// ────────────────────────────────────────────────────────────
function NoticesAdmin() {
  const [list, setList] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, body, pinned, created_at')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('[admin notices]', error)
      setErr(error.message)
      return
    }
    setList((data ?? []) as Notice[])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (title.trim().length < 2 || body.trim().length < 5) {
      setErr('제목 2자, 본문 5자 이상')
      return
    }
    setErr(null)
    setSaving(true)
    const { error } = await supabase
      .from('notices')
      .insert({ title: title.trim(), body: body.trim(), pinned })
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    setTitle('')
    setBody('')
    setPinned(false)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('정말 삭제할까요?')) return
    const { error } = await supabase.from('notices').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function togglePin(n: Notice) {
    const { error } = await supabase
      .from('notices')
      .update({ pinned: !n.pinned })
      .eq('id', n.id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>+ 새 공지</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 80))}
          placeholder="제목"
          style={inputStyle}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          placeholder="본문"
          style={{ ...inputStyle, minHeight: 100, marginTop: 6, resize: 'vertical' }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <label
            style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            상단 고정
          </label>
          <div style={{ flex: 1 }} />
          <PixelButton
            sm
            color="#111"
            bg="var(--red)"
            fg="#FAFAF7"
            onClick={add}
            disabled={saving}
          >
            {saving ? '...' : '등록'}
          </PixelButton>
        </div>
        {err && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: 'var(--red)',
              fontWeight: 700,
            }}
          >
            ✕ {err}
          </div>
        )}
      </PixelBorder>

      {loading ? (
        <div style={loadingStyle}>불러오는 중...</div>
      ) : list.length === 0 ? (
        <div style={loadingStyle}>등록된 공지가 없어요.</div>
      ) : (
        list.map((n) => (
          <PixelBorder key={n.id} color="#111" bg="var(--paper)" padding={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  ★
                </span>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{n.title}</div>
              <div
                style={{ fontSize: 9, opacity: 0.5, fontFamily: gbStyles.fontEn }}
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
                marginTop: 4,
              }}
            >
              {n.body}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <PixelButton
                sm
                color="#111"
                bg="var(--paper)"
                onClick={() => togglePin(n)}
              >
                {n.pinned ? '고정 해제' : '상단 고정'}
              </PixelButton>
              <PixelButton
                sm
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={() => remove(n.id)}
              >
                삭제
              </PixelButton>
            </div>
          </PixelBorder>
        ))
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// 문의 관리
// ────────────────────────────────────────────────────────────
function InquiriesAdmin() {
  const [list, setList] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('[admin inquiries]', error)
      return
    }
    setList((data ?? []) as Inquiry[])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function resolve(id: string) {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function reopen(id: string) {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: 'open', resolved_at: null })
      .eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  if (loading) return <div style={loadingStyle}>불러오는 중...</div>
  if (list.length === 0) return <div style={loadingStyle}>문의가 없어요.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {list.map((q) => (
        <PixelBorder
          key={q.id}
          color="#111"
          bg={q.status === 'open' ? 'var(--paper)' : 'var(--paper-2)'}
          padding={10}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                border: '2px solid #111',
                background: q.status === 'open' ? 'var(--red)' : 'transparent',
                color: q.status === 'open' ? '#FAFAF7' : '#111',
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              {q.status === 'open' ? '미해결' : '해결됨'}
            </span>
            <div style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{q.subject}</div>
            <div style={{ fontSize: 9, opacity: 0.5, fontFamily: gbStyles.fontEn }}>
              {new Date(q.created_at).toLocaleDateString()}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              marginTop: 4,
              color: 'var(--ink-2)',
            }}
          >
            {q.body}
          </div>
          {q.contact && (
            <div
              style={{
                fontSize: 10,
                marginTop: 6,
                fontFamily: gbStyles.fontEn,
                opacity: 0.7,
              }}
            >
              ▶ 회신: {q.contact}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {q.status === 'open' ? (
              <PixelButton
                sm
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={() => resolve(q.id)}
              >
                ✓ 해결됨 표시
              </PixelButton>
            ) : (
              <PixelButton sm color="#111" bg="var(--paper)" onClick={() => reopen(q.id)}>
                ↻ 다시 열기
              </PixelButton>
            )}
          </div>
        </PixelBorder>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// 메타 (버전 / 약관 / 개인정보)
// ────────────────────────────────────────────────────────────
function MetaAdmin() {
  const [meta, setMeta] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('app_meta').select('key, value')
    setLoading(false)
    if (error) {
      console.error('[admin meta]', error)
      return
    }
    const m: Record<string, string> = {}
    for (const r of (data ?? []) as MetaRow[]) m[r.key] = r.value
    setMeta(m)
    setDraft(m)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save(key: string) {
    setSavingKey(key)
    const { error } = await supabase
      .from('app_meta')
      .upsert({ key, value: draft[key] ?? '' }, { onConflict: 'key' })
    setSavingKey(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  if (loading) return <div style={loadingStyle}>불러오는 중...</div>

  const entries: { key: string; label: string; multiline: boolean }[] = [
    { key: 'version', label: '버전', multiline: false },
    { key: 'admin_email', label: '관리자 이메일', multiline: false },
    { key: 'terms', label: '이용약관', multiline: true },
    { key: 'privacy', label: '개인정보 처리방침', multiline: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map((e) => {
        const val = draft[e.key] ?? ''
        const dirty = val !== (meta[e.key] ?? '')
        return (
          <PixelBorder key={e.key} color="#111" bg="var(--paper-2)" padding={12}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, flex: 1 }}>{e.label}</div>
              <code
                style={{
                  fontSize: 9,
                  opacity: 0.5,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                {e.key}
              </code>
            </div>
            {e.multiline ? (
              <textarea
                value={val}
                onChange={(ev) => setDraft((d) => ({ ...d, [e.key]: ev.target.value }))}
                style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
              />
            ) : (
              <input
                value={val}
                onChange={(ev) => setDraft((d) => ({ ...d, [e.key]: ev.target.value }))}
                style={inputStyle}
              />
            )}
            <div
              style={{
                display: 'flex',
                marginTop: 8,
                gap: 6,
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 9, opacity: 0.6, flex: 1 }}>
                {dirty ? '※ 수정됨 — 저장 필요' : ''}
              </div>
              <PixelButton
                sm
                color="#111"
                bg={dirty ? 'var(--red)' : 'var(--paper)'}
                fg={dirty ? '#FAFAF7' : '#111'}
                onClick={() => save(e.key)}
                disabled={!dirty || savingKey === e.key}
              >
                {savingKey === e.key ? '...' : '저장'}
              </PixelButton>
            </div>
          </PixelBorder>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '2px solid #111',
  boxSizing: 'border-box',
  fontFamily: gbStyles.font,
  fontSize: 11,
  background: 'var(--paper)',
  outline: 'none',
}

const loadingStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  fontSize: 11,
  color: 'var(--ink-2)',
}
