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
  hearts_count: number
  comments_count: number
  created_at: string
  profiles: { trainer_id: string } | null
}

function minsAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

function rowToPost(r: PostRow, loc: string): Post {
  const firstLine = r.body.split('\n')[0]
  const t = firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
  return {
    id: r.id,
    who: r.profiles?.trainer_id ?? '익명',
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

  useEffect(() => {
    if (!shop) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)

    // 매장의 supabase uuid 찾고, 그걸로 posts 가져오기
    supabase
      .from('shops')
      .select('id')
      .eq('name', shop.name)
      .eq('lat', shop.lat)
      .eq('lng', shop.lng)
      .maybeSingle()
      .then(({ data: shopRow }) => {
        if (!alive) return
        if (!shopRow) {
          setPosts([])
          setLoading(false)
          return
        }
        supabase
          .from('posts')
          .select(
            'id, body, category, hearts_count, comments_count, created_at, profiles(trainer_id)',
          )
          .eq('shop_id', shopRow.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!alive) return
            setLoading(false)
            if (error) {
              console.error('[shop posts fetch]', error)
              return
            }
            const loc = shop.addr.split(' ').slice(0, 2).join(' ')
            setPosts((data as unknown as PostRow[]).map((r) => rowToPost(r, loc)))
          })
      })
    return () => {
      alive = false
    }
  }, [shop])

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
          padding: '12px 14px 8px',
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>{shop.name}</div>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.7,
                  fontFamily: gbStyles.fontEn,
                  marginTop: 2,
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
          ) : posts.length === 0 ? (
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
