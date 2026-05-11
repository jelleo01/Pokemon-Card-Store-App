import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import PostCard from '@/components/ui/PostCard'
import type { Post } from '@/lib/data'
import { REGIONS } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import { supabase } from '@/lib/supabase'

type Filter = 'latest' | 'near' | 'find'

interface PostRow {
  id: string
  body: string
  category: 'news' | 'ask'
  hearts_count: number | null
  comments_count: number | null
  created_at: string
  user_id: string
  shop_id: string | null
}

interface ProfileRow {
  id: string
  trainer_id: string
}

interface ShopRow {
  id: string
  name: string
  city: string | null
  district: string | null
  dong: string | null
}

function minsAgo(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.round(diffMs / 60000))
}

function buildPost(
  r: PostRow,
  profile: ProfileRow | undefined,
  shop: ShopRow | undefined,
): Post {
  const firstLine = r.body.split('\n')[0]
  const t = firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
  return {
    id: r.id,
    who: profile?.trainer_id ?? '익명',
    loc: shop?.district ?? shop?.city ?? '미지정',
    dong: shop?.dong ?? '',
    t,
    body: r.body,
    tag: r.category === 'news' ? '소식' : '질문',
    mins: minsAgo(r.created_at),
    hearts: r.hearts_count ?? 0,
    comments: Array.from({ length: r.comments_count ?? 0 }, () => ({
      who: '',
      t: '',
      mins: 0,
    })),
  }
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const [filter, setFil] = useState<Filter>('latest')
  const [city, setCity] = useState('전체')
  const [district, setDistrict] = useState('전체')
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const { data: postRows, error: postErr } = await supabase
      .from('posts')
      .select('id, body, category, hearts_count, comments_count, created_at, user_id, shop_id')
      .order('created_at', { ascending: false })
      .limit(100)
    if (postErr) {
      console.error('[community posts]', postErr)
      setErr(`글 목록을 못 가져왔어요: ${postErr.message}`)
      setLoading(false)
      return
    }
    const rows = (postRows ?? []) as PostRow[]
    if (rows.length === 0) {
      setAllPosts([])
      setLoading(false)
      return
    }

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
    const shopIds = Array.from(
      new Set(rows.map((r) => r.shop_id).filter((id): id is string => !!id)),
    )

    const [profilesRes, shopsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, trainer_id').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      shopIds.length > 0
        ? supabase
            .from('shops')
            .select('id, name, city, district, dong')
            .in('id', shopIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (profilesRes.error) console.error('[community profiles]', profilesRes.error)
    if (shopsRes.error) console.error('[community shops]', shopsRes.error)

    const profileMap = new Map<string, ProfileRow>()
    for (const p of (profilesRes.data ?? []) as ProfileRow[]) profileMap.set(p.id, p)
    const shopMap = new Map<string, ShopRow>()
    for (const s of (shopsRes.data ?? []) as ShopRow[]) shopMap.set(s.id, s)

    setAllPosts(
      rows.map((r) =>
        buildPost(r, profileMap.get(r.user_id), r.shop_id ? shopMap.get(r.shop_id) : undefined),
      ),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    let alive = true
    fetchPosts().catch((e) => {
      if (!alive) return
      console.error('[community fetch unexpected]', e)
      setErr(e instanceof Error ? e.message : String(e))
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [fetchPosts, tick])

  const cityFiltered = useMemo(
    () =>
      filter === 'near'
        ? allPosts.filter((p) => {
            if (city === '전체') return true
            const reg = REGIONS.find((r) => r.city === city)
            if (!reg) return true
            if (district !== '전체') return p.loc === district
            return reg.districts.includes(p.loc) || p.loc === city
          })
        : allPosts,
    [allPosts, filter, city, district],
  )

  const feed =
    filter === 'find'
      ? cityFiltered.filter((p) => p.tag === '질문')
      : filter === 'near'
        ? [...cityFiltered].sort((a, b) => a.loc.localeCompare(b.loc))
        : [...cityFiltered].sort((a, b) => a.mins - b.mins)

  const questions = allPosts.filter((p) => p.tag === '질문')
  const cityObj = REGIONS.find((r) => r.city === city)

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
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sprite kind="mega" size={20} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            COMMUNITY
          </div>
          <div style={{ flex: 1 }} />
          <PixelButton
            sm
            color="#111"
            bg="var(--paper)"
            onClick={() => setTick((t) => t + 1)}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            ↻
          </PixelButton>
          <PixelButton
            sm
            color="#111"
            bg="var(--red)"
            fg="#FAFAF7"
            onClick={() => navigate('/post')}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            + 글쓰기
          </PixelButton>
        </div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, letterSpacing: 1 }}>
          ※ 트레이너들의 매장 소식과 질문
        </div>
      </div>

      {/* Filter tabs */}
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
            { id: 'latest', label: '최신', en: 'LATEST' },
            { id: 'near', label: '위치별', en: 'NEAR' },
            { id: 'find', label: '찾기', en: 'FIND' },
          ] as { id: Filter; label: string; en: string }[]
        ).map((f, i, a) => {
          const on = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFil(f.id)}
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
              <span>{f.label}</span>
              <span
                style={{
                  fontSize: 8,
                  opacity: 0.6,
                  fontFamily: gbStyles.fontEn,
                  letterSpacing: 2,
                }}
              >
                {f.en}
              </span>
            </button>
          )
        })}
      </div>

      {/* 위치별 sub-filter */}
      {filter === 'near' && (
        <div
          style={{
            borderBottom: '2px solid #111',
            background: 'var(--paper-2)',
            padding: '8px 12px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: 'var(--ink-2)',
              marginBottom: 4,
              fontFamily: gbStyles.fontEn,
            }}
          >
            시 / CITY
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {['전체', ...REGIONS.map((r) => r.city)].map((c) => {
              const on = city === c
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCity(c)
                    setDistrict('전체')
                  }}
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    border: '2px solid #111',
                    background: on ? '#111' : 'var(--paper)',
                    color: on ? '#FAFAF7' : '#111',
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    fontWeight: 700,
                  }}
                >
                  {c}
                </button>
              )
            })}
          </div>
          {cityObj && (
            <>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 2,
                  color: 'var(--ink-2)',
                  marginBottom: 4,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                구 / DISTRICT
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['전체', ...cityObj.districts].map((d) => {
                  const on = district === d
                  return (
                    <button
                      key={d}
                      onClick={() => setDistrict(d)}
                      style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        border: '2px solid #111',
                        background: on ? '#D9D7CF' : 'var(--paper)',
                        color: '#111',
                        cursor: 'pointer',
                        fontFamily: gbStyles.font,
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        {err && (
          <div
            style={{
              padding: '10px 12px',
              border: '2px solid var(--red)',
              background: '#FCE7E7',
              color: 'var(--red)',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            ✕ {err}
            <div style={{ marginTop: 6 }}>
              <PixelButton
                sm
                color="#111"
                bg="var(--paper)"
                onClick={() => setTick((t) => t + 1)}
              >
                ↻ 다시 시도
              </PixelButton>
            </div>
          </div>
        )}
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
          <>
            {feed.map((p) => (
              <PostCard key={p.id} p={p} onClick={() => navigate(`/post/${p.id}`)} />
            ))}
            {feed.length === 0 && !err && (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                  lineHeight: 1.6,
                }}
              >
                아직 글이 없어요.
                <br />
                첫 글의 주인공이 되어보세요!
              </div>
            )}

            {filter === 'latest' && questions.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <div style={{ flex: 1, height: 2, background: '#111' }} />
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 2,
                      fontFamily: gbStyles.fontEn,
                      fontWeight: 700,
                    }}
                  >
                    ? 질문 / Q&amp;A
                  </div>
                  <div style={{ flex: 1, height: 2, background: '#111' }} />
                </div>
                {questions.slice(0, 2).map((p) => (
                  <PostCard
                    key={'q-' + p.id}
                    p={p}
                    compact
                    onClick={() => navigate(`/post/${p.id}`)}
                  />
                ))}
              </>
            )}
          </>
        )}

        <div style={{ height: 8 }} />
      </div>

      <GBTabBar active="community" />
    </div>
  )
}
