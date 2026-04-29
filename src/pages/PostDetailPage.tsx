import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { gbStyles } from '@/lib/gbStyles'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PostDetail {
  id: string
  body: string
  category: 'news' | 'ask'
  hearts_count: number
  created_at: string
  who: string
  loc: string
  dong: string
  shop_name: string
}

interface CommentRow {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles: { trainer_id: string } | null
}

function minsAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

export default function PostDetailPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams()

  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [hearted, setHeart] = useState(false)
  const [hearts, setHearts] = useState(0)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    supabase
      .from('posts')
      .select(
        'id, body, category, hearts_count, created_at, profiles(trainer_id), shops(name, city, district, dong)',
      )
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        setLoading(false)
        if (error || !data) {
          setNotFound(true)
          return
        }
        const row = data as unknown as {
          id: string
          body: string
          category: 'news' | 'ask'
          hearts_count: number
          created_at: string
          profiles: { trainer_id: string } | null
          shops: {
            name: string
            city: string | null
            district: string | null
            dong: string | null
          } | null
        }
        setPost({
          id: row.id,
          body: row.body,
          category: row.category,
          hearts_count: row.hearts_count ?? 0,
          created_at: row.created_at,
          who: row.profiles?.trainer_id ?? '익명',
          loc: row.shops?.district ?? row.shops?.city ?? '',
          dong: row.shops?.dong ?? '',
          shop_name: row.shops?.name ?? '',
        })
        setHearts(row.hearts_count ?? 0)
      })
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let alive = true
    supabase
      .from('comments')
      .select('id, body, created_at, user_id, profiles(trainer_id)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          console.error('[comments fetch]', error)
          return
        }
        setComments((data as unknown as CommentRow[]) ?? [])
      })
    return () => {
      alive = false
    }
  }, [id])

  // 내가 누른 좋아요 여부 fetch
  useEffect(() => {
    if (!id || !user) return
    let alive = true
    supabase
      .from('hearts')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return
        setHeart(!!data)
      })
    return () => {
      alive = false
    }
  }, [id, user])

  async function toggleHeart() {
    if (!id || !user) return
    if (hearted) {
      setHeart(false)
      setHearts((h) => Math.max(0, h - 1))
      const { error } = await supabase
        .from('hearts')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id)
      if (error) {
        setHeart(true)
        setHearts((h) => h + 1)
      }
    } else {
      setHeart(true)
      setHearts((h) => h + 1)
      const { error } = await supabase
        .from('hearts')
        .insert({ post_id: id, user_id: user.id })
      if (error) {
        setHeart(false)
        setHearts((h) => Math.max(0, h - 1))
      }
    }
  }

  async function submitComment() {
    if (!id || !user) return
    const text = draft.trim()
    if (!text) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, body: text })
      .select('id, body, created_at, user_id, profiles(trainer_id)')
      .single()
    setSubmitting(false)
    if (error) {
      alert(error.message)
      return
    }
    setComments((cs) => [...cs, data as unknown as CommentRow])
    setDraft('')
  }

  if (loading) {
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
        불러오는 중...
      </div>
    )
  }

  if (notFound || !post) {
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
        글을 찾을 수 없어요.
        <PixelButton color="#111" bg="var(--paper)" onClick={() => navigate('/community')}>
          ◀ 커뮤니티로
        </PixelButton>
      </div>
    )
  }

  const isAsk = post.category === 'ask'
  const title =
    post.body.split('\n')[0].length > 40
      ? post.body.split('\n')[0].slice(0, 40) + '…'
      : post.body.split('\n')[0]

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
          <BackButton onClick={() => navigate('/community')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {post.shop_name || 'POST'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: 14, borderBottom: '2px solid #111' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                border: '2px solid #111',
                background: isAsk ? 'var(--paper)' : 'var(--red)',
                color: isAsk ? '#111' : '#FAFAF7',
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              {isAsk ? '? 질문' : '★ 소식'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>
              {post.loc}
              {post.dong ? ' · ' + post.dong : ''}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 9,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontEn,
              }}
            >
              {minsAgo(post.created_at)}m
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
            {post.body}
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                background: 'var(--paper-2)',
                border: '2px solid #111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprite kind="ball" size={14} />
            </div>
            <span style={{ fontWeight: 700 }}>{post.who}</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={toggleHeart}
              disabled={!user}
              style={{
                padding: '4px 10px',
                border: '2px solid #111',
                background: hearted ? 'var(--red)' : 'var(--paper)',
                color: hearted ? '#FAFAF7' : '#111',
                cursor: user ? 'pointer' : 'not-allowed',
                fontFamily: gbStyles.font,
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {hearted ? '♥' : '♡'} {hearts}
            </button>
            <div
              style={{
                padding: '4px 10px',
                border: '2px solid #111',
                background: 'var(--paper)',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              💬 {comments.length}
            </div>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 8,
              fontFamily: gbStyles.fontEn,
              fontWeight: 700,
            }}
          >
            COMMENTS · {comments.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.map((c) => (
              <PixelBorder key={c.id} color="#111" bg="var(--paper-2)" padding={0}>
                <div style={{ padding: '8px 10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 2,
                      fontSize: 10,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {c.profiles?.trainer_id ?? '익명'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span
                      style={{
                        color: 'var(--ink-2)',
                        fontFamily: gbStyles.fontEn,
                      }}
                    >
                      {minsAgo(c.created_at)}m
                    </span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.body}</div>
                </div>
              </PixelBorder>
            ))}
            {comments.length === 0 && (
              <div
                style={{
                  padding: 16,
                  textAlign: 'center',
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                아직 댓글이 없어요. 첫 댓글을 남겨보세요!
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 8 }} />
      </div>

      <div
        style={{
          borderTop: '2px solid #111',
          padding: 8,
          background: 'var(--paper-2)',
          flexShrink: 0,
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? '댓글 달기...' : '로그인이 필요해요'}
          disabled={!user}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submitComment()
            }
          }}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '2px solid #111',
            boxSizing: 'border-box',
            fontFamily: gbStyles.font,
            fontSize: 12,
            background: 'var(--paper)',
            outline: 'none',
          }}
        />
        <PixelButton
          sm
          color="#111"
          bg="var(--red)"
          fg="#FAFAF7"
          onClick={submitComment}
          disabled={!user || submitting || !draft.trim()}
        >
          {submitting ? '...' : '등록'}
        </PixelButton>
      </div>
    </div>
  )
}
