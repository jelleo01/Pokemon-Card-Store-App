import { useEffect, useMemo, useState } from 'react'
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
  hearts_count: number
  comments_count: number
  created_at: string
  profiles: { trainer_id: string } | null
  shops: { name: string; city: string | null; district: string | null; dong: string | null } | null
}

function minsAgo(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.round(diffMs / 60000))
}

function rowToPost(r: PostRow): Post {
  const firstLine = r.body.split('\n')[0]
  const t = firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
  return {
    id: r.id,
    who: r.profiles?.trainer_id ?? '익명',
    loc: r.shops?.district ?? r.shops?.city ?? '미지정',
    dong: r.shops?.dong ?? '',
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

  useEffect(() => {
    let alive = true
    setLoading(true)
    supabase
      .from('posts')
      .select(
        'id, body, category, hearts_count, comments_count, created_at, profiles(trainer_id), shops(name, city, district, dong)',
      )
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!alive) return
        setLoading(false)
        if (error) {
          console.error('[community fetch]', error)
          return
        }
        setAllPosts((data as unknown as PostRow[]).map(rowToPost))
      })
    return () => {
      alive = false
    }
  }, [])

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
            {feed.length === 0 && (
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
