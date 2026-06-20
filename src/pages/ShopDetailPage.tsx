import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import TypePin from '@/components/ui/TypePin'
import BackButton from '@/components/ui/BackButton'
import PostCard from '@/components/ui/PostCard'
import { SHOPS, type Post } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import { supabase } from '@/lib/supabase'

interface PostRow {
  id: string
  body: string
  category: 'news' | 'ask'
  hearts_count: number | null
  comments_count: number | null
  created_at: string
  user_id: string
}

interface ProfileRow {
  id: string
  trainer_id: string
}

function minsAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

function buildPost(r: PostRow, profile: ProfileRow | undefined, loc: string): Post {
  const firstLine = r.body.split('\n')[0]
  const t = firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
  return {
    id: r.id,
    who: profile?.trainer_id ?? '익명',
    loc,
    dong: '',
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

export default function ShopDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const shop = SHOPS.find((s) => s.id === id)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!shop) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setErr(null)

    ;(async () => {
      // 1) shops 테이블에서 매장 uuid 찾기 (이름+좌표로)
      const { data: shopRow, error: shopErr } = await supabase
        .from('shops')
        .select('id')
        .eq('name', shop.name)
        .eq('lat', shop.lat)
        .eq('lng', shop.lng)
        .maybeSingle()
      if (!alive) return
      if (shopErr) {
        console.error('[shop lookup]', shopErr)
        setErr(`매장 조회 실패: ${shopErr.message}`)
        setLoading(false)
        return
      }
      if (!shopRow) {
        // 아직 supabase 에 등록되지 않은 매장 → 글이 있을 수 없음
        setPosts([])
        setLoading(false)
        return
      }

      // 2) 그 매장의 posts
      const { data: postRows, error: postErr } = await supabase
        .from('posts')
        .select('id, body, category, hearts_count, comments_count, created_at, user_id')
        .eq('shop_id', shopRow.id)
        .order('created_at', { ascending: false })
      if (!alive) return
      if (postErr) {
        console.error('[shop posts]', postErr)
        setErr(`글 목록 실패: ${postErr.message}`)
        setLoading(false)
        return
      }
      const rows = (postRows ?? []) as PostRow[]

      // 3) 작성자 프로필
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
      const profileMap = new Map<string, ProfileRow>()
      if (userIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, trainer_id')
          .in('id', userIds)
        if (profErr) console.error('[shop profiles]', profErr)
        for (const p of (profiles ?? []) as ProfileRow[]) profileMap.set(p.id, p)
      }

      const loc = shop.addr.split(' ').slice(0, 2).join(' ')
      if (!alive) return
      setPosts(rows.map((r) => buildPost(r, profileMap.get(r.user_id), loc)))
      setLoading(false)
    })().catch((e) => {
      if (!alive) return
      console.error('[shop detail unexpected]', e)
      setErr(e instanceof Error ? e.message : String(e))
      setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [shop, tick])

  if (!shop) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: gbStyles.font,
          color: 'var(--ink-2)',
        }}
      >
        매장을 찾을 수 없어요.
        <PixelButton color="#111" bg="var(--paper)" onClick={() => navigate('/map')}>
          ◀ 지도로
        </PixelButton>
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
          padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackButton onClick={() => navigate('/map')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {shop.name}
          </div>
          <PixelButton
            sm
            color="#111"
            bg="var(--paper)"
            onClick={() => setTick((t) => t + 1)}
          >
            ↻
          </PixelButton>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
        }}
      >
        {/* 매장 정보 카드 */}
        <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TypePin type={shop.type} size={20} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: gbStyles.fontReadable,
                }}
              >
                {shop.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.75,
                  fontFamily: gbStyles.fontReadable,
                  marginTop: 3,
                }}
              >
                {shop.type} · {shop.addr}
              </div>
            </div>
          </div>
        </PixelBorder>

        {/* 매장의 글 목록 */}
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              fontFamily: gbStyles.fontEn,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            POSTS · {posts.length}
          </div>
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
                marginBottom: 8,
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
          ) : posts.length === 0 && !err ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--ink-2)',
                lineHeight: 1.6,
              }}
            >
              아직 이 매장에 대한 글이 없어요.
              <br />첫 소식을 남겨보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.map((p) => (
                <PostCard key={p.id} p={p} onClick={() => navigate(`/post/${p.id}`)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
