import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'
import { searchPlaces, type KakaoPlace } from '@/lib/kakao'
import { SHOPS as SEED_SHOPS, type Shop, type ShopType } from '@/lib/data'

type Tab = 'users' | 'shops' | 'notices' | 'inquiries' | 'meta'

// seed 매장(클라이언트 SHOPS) 의 한글 type → DB enum 매핑
const TYPE_KO_TO_DB: Record<ShopType, ShopRow['type']> = {
  공식: 'popup',
  자판기: 'vending',
  편의점: 'cvs',
  카드샵: 'cardshop',
}

interface AdminUser {
  id: string
  email: string | null
  trainer_id: string | null
  city: string | null
  district: string | null
  phone: string | null
  created_at: string
  is_admin: boolean
  posts_count: number
}

interface AdminStats {
  users_count: number
  shops_count: number
  posts_count: number
  comments_count: number
  notices_count: number
  inquiries_open: number
}

interface ShopRow {
  id: string
  name: string
  type: 'cardshop' | 'vending' | 'cvs' | 'popup'
  addr: string
  lat: number
  lng: number
  city: string | null
  district: string | null
  verified: boolean
  created_at: string
}

const SHOP_TYPE_LABEL: Record<ShopRow['type'], string> = {
  cardshop: '카드샵',
  vending: '자판기',
  cvs: '편의점',
  popup: '공식',
}

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
  const [tab, setTab] = useState<Tab>('users')
  const [stats, setStats] = useState<AdminStats | null>(null)

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

  // 헤더 통계 — 관리자 진입 시 1회 fetch (탭 전환과 무관)
  useEffect(() => {
    if (!user?.isAdmin) return
    let alive = true
    supabase.rpc('admin_stats').then(({ data, error }) => {
      if (!alive) return
      if (error) {
        console.error('[admin_stats]', error)
        return
      }
      const row = (Array.isArray(data) ? data[0] : data) as AdminStats | null
      if (row) setStats(row)
    })
    return () => {
      alive = false
    }
  }, [user?.isAdmin, tab])

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

        {/* 통계 mini row */}
        {stats && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 8,
              fontSize: 9,
              fontFamily: gbStyles.fontEn,
              letterSpacing: 1,
              flexWrap: 'wrap',
            }}
          >
            <StatChip label="USERS" v={stats.users_count} />
            <StatChip label="SHOPS" v={stats.shops_count} />
            <StatChip label="POSTS" v={stats.posts_count} />
            <StatChip label="CMTS" v={stats.comments_count} />
            <StatChip
              label="OPEN-Q"
              v={stats.inquiries_open}
              accent={stats.inquiries_open > 0}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {(
          [
            { id: 'users', label: '사용자', en: 'USERS' },
            { id: 'shops', label: '매장', en: 'SHOPS' },
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
        {tab === 'users' && <UsersAdmin />}
        {tab === 'shops' && <ShopsAdmin />}
        {tab === 'notices' && <NoticesAdmin />}
        {tab === 'inquiries' && <InquiriesAdmin />}
        {tab === 'meta' && <MetaAdmin />}
      </div>
    </div>
  )
}

function StatChip({ label, v, accent }: { label: string; v: number; accent?: boolean }) {
  return (
    <span
      style={{
        padding: '1px 5px',
        border: '2px solid #111',
        background: accent ? 'var(--red)' : 'var(--paper)',
        color: accent ? '#FAFAF7' : '#111',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label} {v}
    </span>
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

// ────────────────────────────────────────────────────────────
// 사용자 관리 — 가입자 목록, 관리자 부여/해제
// ────────────────────────────────────────────────────────────
function UsersAdmin() {
  const { user: me } = useAuth()
  const [list, setList] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_list_users')
    setLoading(false)
    if (error) {
      console.error('[admin_list_users]', error)
      setErr(error.message)
      return
    }
    setErr(null)
    setList((data ?? []) as AdminUser[])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return list
    return list.filter((u) => {
      const hay = (
        (u.email ?? '') +
        ' ' +
        (u.trainer_id ?? '') +
        ' ' +
        (u.city ?? '') +
        ' ' +
        (u.district ?? '')
      ).toLowerCase()
      return hay.includes(s)
    })
  }, [list, q])

  async function grant(uid: string) {
    const { error } = await supabase.rpc('admin_grant', { target_uid: uid })
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }
  async function revoke(uid: string) {
    if (!confirm('관리자 권한을 해제할까요?')) return
    const { error } = await supabase.rpc('admin_revoke', { target_uid: uid })
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  if (loading) return <div style={loadingStyle}>불러오는 중...</div>
  if (err)
    return (
      <div style={{ ...loadingStyle, color: 'var(--red)' }}>
        ✕ {err}
        <div style={{ marginTop: 8, fontSize: 9 }}>
          admin.sql 의 admin_list_users 함수가 적용됐는지 확인하세요
        </div>
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="이메일/트레이너ID/지역 검색"
        style={inputStyle}
      />
      <div style={{ fontSize: 10, opacity: 0.6, fontFamily: gbStyles.fontEn }}>
        TOTAL {list.length} · MATCH {filtered.length}
      </div>
      {filtered.map((u) => {
        const isMe = me?.id === u.id
        return (
          <PixelBorder
            key={u.id}
            color="#111"
            bg={u.is_admin ? 'var(--paper-2)' : 'var(--paper)'}
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
              {u.is_admin && (
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
                  ADMIN
                </span>
              )}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: gbStyles.fontReadable,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {u.trainer_id ?? '(온보딩 미완료)'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.5,
                  fontFamily: gbStyles.fontEn,
                  flexShrink: 0,
                }}
              >
                {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: gbStyles.fontReadable,
                color: 'var(--ink-2)',
                wordBreak: 'break-all',
                marginBottom: 2,
              }}
            >
              {u.email ?? '(이메일 없음)'}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: gbStyles.fontReadable,
                color: 'var(--ink-2)',
              }}
            >
              {[u.city, u.district].filter(Boolean).join(' ') || '지역 미설정'}
              {' · 글 '}
              {u.posts_count}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {u.email && (
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--paper)"
                  onClick={() => {
                    navigator.clipboard?.writeText(u.email!)
                  }}
                >
                  📋 이메일 복사
                </PixelButton>
              )}
              {u.is_admin ? (
                isMe ? (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '4px 8px',
                      opacity: 0.5,
                      alignSelf: 'center',
                    }}
                  >
                    (본인)
                  </span>
                ) : (
                  <PixelButton
                    sm
                    color="#111"
                    bg="var(--paper)"
                    onClick={() => revoke(u.id)}
                  >
                    관리자 해제
                  </PixelButton>
                )
              ) : (
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--red)"
                  fg="#FAFAF7"
                  onClick={() => grant(u.id)}
                >
                  + 관리자 지정
                </PixelButton>
              )}
            </div>
          </PixelBorder>
        )
      })}
      {filtered.length === 0 && <div style={loadingStyle}>일치하는 사용자가 없어요.</div>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// 매장 관리 — CRUD + kakao 검색으로 좌표 자동 채움
// ────────────────────────────────────────────────────────────
function ShopsAdmin() {
  const [list, setList] = useState<ShopRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, type, addr, lat, lng, city, district, verified, created_at')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('[admin shops]', error)
      return
    }
    setList((data ?? []) as ShopRow[])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return list
    return list.filter((sh) =>
      ((sh.name ?? '') + ' ' + (sh.addr ?? '') + ' ' + (sh.city ?? '') + ' ' + (sh.district ?? ''))
        .toLowerCase()
        .includes(s),
    )
  }, [list, q])

  // DB 에 이미 들어간 매장의 (name|lat|lng) 키 집합 — seed 와 매칭하기 위함
  const dbKeySet = useMemo(
    () => new Set(list.map((s) => `${s.name}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`)),
    [list],
  )

  // seed-only — 아직 DB 에 없는 클라이언트 SHOPS
  const seedOnly = useMemo(
    () =>
      SEED_SHOPS.filter(
        (s) => !dbKeySet.has(`${s.name}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`),
      ),
    [dbKeySet],
  )

  const seedFiltered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return seedOnly
    return seedOnly.filter((sh) =>
      ((sh.name ?? '') + ' ' + (sh.addr ?? '')).toLowerCase().includes(s),
    )
  }, [seedOnly, q])

  const [seedShowAll, setSeedShowAll] = useState(false)
  const seedDisplay = seedShowAll ? seedFiltered : seedFiltered.slice(0, 50)

  async function registerSeed(s: Shop) {
    const parts = s.addr.split(' ')
    const city = parts[0] || null
    const district = parts[1] || null
    const { error } = await supabase.from('shops').insert({
      name: s.name,
      addr: s.addr,
      type: TYPE_KO_TO_DB[s.type],
      lat: s.lat,
      lng: s.lng,
      city,
      district,
      verified: false,
    })
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function registerAllSeed() {
    if (!confirm(`${seedFiltered.length}개 seed 매장을 모두 DB 에 등록할까요?`)) return
    const payload = seedFiltered.map((s) => {
      const parts = s.addr.split(' ')
      return {
        name: s.name,
        addr: s.addr,
        type: TYPE_KO_TO_DB[s.type],
        lat: s.lat,
        lng: s.lng,
        city: parts[0] || null,
        district: parts[1] || null,
        verified: false,
      }
    })
    const { error } = await supabase.from('shops').insert(payload)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function remove(id: string) {
    if (!confirm('매장을 삭제할까요? 연결된 글의 shop_id 가 null 됩니다.')) return
    const { error } = await supabase.from('shops').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function toggleVerified(s: ShopRow) {
    const { error } = await supabase
      .from('shops')
      .update({ verified: !s.verified })
      .eq('id', s.id)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="매장명/주소 검색"
          style={inputStyle}
        />
        <PixelButton
          sm
          color="#111"
          bg="var(--red)"
          fg="#FAFAF7"
          onClick={() => setShowAdd((o) => !o)}
        >
          {showAdd ? '취소' : '+ 추가'}
        </PixelButton>
      </div>

      {showAdd && (
        <ShopForm
          mode="add"
          onCancel={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            load()
          }}
        />
      )}

      <div
        style={{
          fontSize: 10,
          opacity: 0.6,
          fontFamily: gbStyles.fontEn,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span>DB {list.length}</span>
        <span>· SEED(미등록) {seedOnly.length}</span>
        <span>· MATCH {filtered.length + seedFiltered.length}</span>
        {seedFiltered.length > 0 && (
          <>
            <div style={{ flex: 1 }} />
            <PixelButton sm color="#111" bg="var(--paper)" onClick={registerAllSeed}>
              검색 결과 일괄 DB 등록 ({seedFiltered.length})
            </PixelButton>
          </>
        )}
      </div>

      {loading ? (
        <div style={loadingStyle}>불러오는 중...</div>
      ) : filtered.length === 0 && seedFiltered.length === 0 ? (
        <div style={loadingStyle}>일치하는 매장이 없어요.</div>
      ) : (
        filtered.map((s) =>
          editingId === s.id ? (
            <ShopForm
              key={s.id}
              mode="edit"
              shop={s}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null)
                load()
              }}
            />
          ) : (
            <PixelBorder key={s.id} color="#111" bg="var(--paper)" padding={10}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                {s.verified && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      border: '2px solid #111',
                      background: '#1E88FF',
                      color: '#FAFAF7',
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    ✓ 검증
                  </span>
                )}
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    border: '2px solid #111',
                    background: 'var(--paper-2)',
                    fontFamily: gbStyles.fontEn,
                  }}
                >
                  {SHOP_TYPE_LABEL[s.type]}
                </span>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: gbStyles.fontReadable,
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: gbStyles.fontReadable,
                  color: 'var(--ink-2)',
                  marginBottom: 4,
                }}
              >
                {s.addr || '(주소 없음)'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: gbStyles.fontEn,
                  opacity: 0.55,
                }}
              >
                {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--paper)"
                  onClick={() => setEditingId(s.id)}
                >
                  ✎ 편집
                </PixelButton>
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--paper)"
                  onClick={() => toggleVerified(s)}
                >
                  {s.verified ? '검증 해제' : '검증 표시'}
                </PixelButton>
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--red)"
                  fg="#FAFAF7"
                  onClick={() => remove(s.id)}
                >
                  삭제
                </PixelButton>
              </div>
            </PixelBorder>
          ),
        )
      )}

      {/* seed-only — 클라이언트 SHOPS 중 아직 DB 에 안 들어간 매장들 */}
      {seedDisplay.length > 0 && (
        <>
          <div
            style={{
              marginTop: 16,
              padding: '6px 0 4px',
              borderBottom: '2px solid #111',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: gbStyles.fontReadable,
                flex: 1,
              }}
            >
              ▼ Seed 매장 (아직 DB 미등록 · {seedFiltered.length}건)
            </div>
            <PixelButton
              sm
              color="#111"
              bg="var(--red)"
              fg="#FAFAF7"
              onClick={registerAllSeed}
            >
              전부 등록
            </PixelButton>
          </div>
          {seedDisplay.map((s) => (
            <PixelBorder
              key={s.id}
              color="#111"
              bg="var(--paper-2)"
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
                    background: 'var(--paper)',
                    fontFamily: gbStyles.fontEn,
                    opacity: 0.7,
                  }}
                >
                  SEED
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    fontFamily: gbStyles.fontReadable,
                  }}
                >
                  {s.type}
                </span>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: gbStyles.fontReadable,
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: gbStyles.fontReadable,
                  color: 'var(--ink-2)',
                  marginBottom: 4,
                }}
              >
                {s.addr || '(주소 없음)'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: gbStyles.fontEn,
                  opacity: 0.55,
                }}
              >
                {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
              </div>
              <div style={{ marginTop: 8 }}>
                <PixelButton
                  sm
                  color="#111"
                  bg="var(--red)"
                  fg="#FAFAF7"
                  onClick={() => registerSeed(s)}
                >
                  + DB 등록 (편집 가능해짐)
                </PixelButton>
              </div>
            </PixelBorder>
          ))}
          {seedFiltered.length > seedDisplay.length && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <PixelButton
                sm
                color="#111"
                bg="var(--paper)"
                onClick={() => setSeedShowAll(true)}
              >
                ▼ 나머지 {seedFiltered.length - seedDisplay.length}개 더 보기
              </PixelButton>
            </div>
          )}
          {seedShowAll && (
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <PixelButton
                sm
                color="#111"
                bg="var(--paper)"
                onClick={() => setSeedShowAll(false)}
              >
                ▲ 처음 50개만 보기
              </PixelButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 매장 추가/편집 폼
interface ShopFormProps {
  mode: 'add' | 'edit'
  shop?: ShopRow
  onCancel: () => void
  onSaved: () => void
}

function ShopForm({ mode, shop, onCancel, onSaved }: ShopFormProps) {
  const [name, setName] = useState(shop?.name ?? '')
  const [addr, setAddr] = useState(shop?.addr ?? '')
  const [type, setType] = useState<ShopRow['type']>(shop?.type ?? 'cardshop')
  const [lat, setLat] = useState<string>(shop?.lat?.toString() ?? '')
  const [lng, setLng] = useState<string>(shop?.lng?.toString() ?? '')
  const [city, setCity] = useState(shop?.city ?? '')
  const [district, setDistrict] = useState(shop?.district ?? '')
  const [verified, setVerified] = useState(shop?.verified ?? false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // kakao 검색
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState(mode === 'edit')

  useEffect(() => {
    if (picked) return
    const q = name.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    let alive = true
    setSearching(true)
    const t = setTimeout(async () => {
      const r = await searchPlaces(q, 6)
      if (!alive) return
      setSearching(false)
      setResults(r)
    }, 300)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [name, picked])

  function pick(p: KakaoPlace) {
    setName(p.name)
    setAddr(p.addr)
    setLat(p.lat.toString())
    setLng(p.lng.toString())
    if (p.category.includes('편의점')) setType('cvs')
    else if (p.name.includes('포켓몬') && p.name.includes('센터')) setType('popup')
    setResults([])
    setPicked(true)
  }

  async function save() {
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    if (name.trim().length < 2) {
      setErr('매장명을 2자 이상')
      return
    }
    if (Number.isNaN(latN) || Number.isNaN(lngN)) {
      setErr('lat/lng 가 숫자여야 합니다')
      return
    }
    setErr(null)
    setSaving(true)
    const payload = {
      name: name.trim(),
      addr: addr.trim(),
      type,
      lat: latN,
      lng: lngN,
      city: city.trim() || null,
      district: district.trim() || null,
      verified,
    }
    const { error } =
      mode === 'add'
        ? await supabase.from('shops').insert(payload)
        : await supabase.from('shops').update(payload).eq('id', shop!.id)
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    onSaved()
  }

  return (
    <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
        {mode === 'add' ? '+ 새 매장' : '✎ 편집'}
      </div>

      <FormRow label="이름 (검색)">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, 80))
            setPicked(false)
          }}
          placeholder="매장명을 입력하세요 (카카오 검색)"
          style={inputStyle}
        />
        {searching && (
          <div style={{ fontSize: 9, opacity: 0.55, marginTop: 2 }}>검색 중…</div>
        )}
        {results.length > 0 && (
          <div
            style={{
              border: '2px solid #111',
              background: 'var(--paper)',
              maxHeight: 160,
              overflowY: 'auto',
              marginTop: 4,
            }}
          >
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: 'none',
                  borderBottom: '1px dashed rgba(0,0,0,0.15)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: gbStyles.fontReadable,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-2)' }}>
                  {r.addr || r.category}
                </div>
              </button>
            ))}
          </div>
        )}
      </FormRow>

      <FormRow label="주소">
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value.slice(0, 200))}
          style={inputStyle}
        />
      </FormRow>

      <FormRow label="분류">
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(Object.keys(SHOP_TYPE_LABEL) as ShopRow['type'][]).map((t) => {
            const on = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  fontSize: 10,
                  padding: '3px 7px',
                  border: '2px solid #111',
                  background: on ? '#111' : 'var(--paper)',
                  color: on ? '#FAFAF7' : '#111',
                  cursor: 'pointer',
                  fontFamily: gbStyles.fontReadable,
                  fontWeight: 700,
                }}
              >
                {SHOP_TYPE_LABEL[t]}
              </button>
            )
          })}
        </div>
      </FormRow>

      <div style={{ display: 'flex', gap: 6 }}>
        <FormRow label="lat">
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={inputStyle}
          />
        </FormRow>
        <FormRow label="lng">
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            style={inputStyle}
          />
        </FormRow>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <FormRow label="시">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 30))}
            placeholder="예: 서울"
            style={inputStyle}
          />
        </FormRow>
        <FormRow label="구">
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value.slice(0, 30))}
            placeholder="예: 강남구"
            style={inputStyle}
          />
        </FormRow>
      </div>

      <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
        />
        ✓ 검증된 매장
      </label>

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

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <PixelButton sm color="#111" bg="var(--paper)" onClick={onCancel}>
          취소
        </PixelButton>
        <div style={{ flex: 1 }} />
        <PixelButton
          sm
          color="#111"
          bg="var(--red)"
          fg="#FAFAF7"
          onClick={save}
          disabled={saving}
        >
          {saving ? '...' : '저장'}
        </PixelButton>
      </div>
    </PixelBorder>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6, flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          color: 'var(--ink-2)',
          letterSpacing: 1,
          marginBottom: 3,
          fontFamily: gbStyles.fontEn,
        }}
      >
        {label}
      </div>
      {children}
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
