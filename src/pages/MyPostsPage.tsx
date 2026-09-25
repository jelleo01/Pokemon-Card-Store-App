import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

type Tab = 'posts' | 'comments' | 'hearts'

interface MyPost {
  id: string
  body: string
  category: 'news' | 'ask'
  hearts_count: number
  comments_count: number
  created_at: string
}

interface MyComment {
  id: string
  body: string
  created_at: string
  post_id: string
}

function timeAgo(iso: string): string {
  const n = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (n < 1) return '방금'
  if (n < 60) return `${n}분 전`
  const h = Math.round(n / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.round(n / 1440)
  if (d < 30) return `${d}일 전`
  const mo = Math.round(n / (30 * 1440))
  if (mo < 12) return `${mo}달 전`
  return `${Math.round(n / (365 * 1440))}년 전`
}

function PostRow({
  post,
  onOpen,
  onDelete,
}: {
  post: MyPost
  onOpen: () => void
  onDelete?: () => void
}) {
  const firstLine = post.body.split('\n')[0]
  const title = firstLine.length > 38 ? firstLine.slice(0, 38) + '…' : firstLine
  return (
    <div
      onClick={onOpen}
      style={{
        border: '2px solid #111',
        background: 'var(--paper-2)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          fontSize: 9,
          padding: '1px 5px',
          border: '2px solid #111',
          background: post.category === 'ask' ? 'var(--paper)' : 'var(--red)',
          color: post.category === 'ask' ? '#111' : '#FAFAF7',
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: gbStyles.font,
        }}
      >
        {post.category === 'ask' ? '질문' : '소식'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: gbStyles.fontReadable,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 2, fontFamily: gbStyles.fontReadable }}>
          {timeAgo(post.created_at)} · ♡ {post.hearts_count ?? 0} · 💬 {post.comments_count ?? 0}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            padding: '3px 8px',
            border: '2px solid var(--red)',
            background: 'var(--paper)',
            color: 'var(--red)',
            fontSize: 10,
            fontFamily: gbStyles.font,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          삭제
        </button>
      )}
    </div>
  )
}

function CommentRow({ comment, onOpen }: { comment: MyComment; onOpen: () => void }) {
  const preview = comment.body.length > 50 ? comment.body.slice(0, 50) + '…' : comment.body
  return (
    <div
      onClick={onOpen}
      style={{
        border: '2px solid #111',
        background: 'var(--paper-2)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: gbStyles.fontReadable,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {preview}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 2, fontFamily: gbStyles.fontReadable }}>
          {timeAgo(comment.created_at)}
        </div>
      </div>
      <span style={{ fontSize: 10, opacity: 0.4, flexShrink: 0 }}>▶</span>
    </div>
  )
}

export default function MyPostsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [myPosts, setMyPosts] = useState<MyPost[]>([])
  const [myComments, setMyComments] = useState<MyComment[]>([])
  const [myHearts, setMyHearts] = useState<MyPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let alive = true
    setLoading(true)

    Promise.all([
      supabase
        .from('posts')
        .select('id, body, category, hearts_count, comments_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select('id, body, created_at, post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('hearts')
        .select('post_id, posts(id, body, category, hearts_count, comments_count, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([postsRes, commentsRes, heartsRes]) => {
      if (!alive) return
      setMyPosts((postsRes.data ?? []) as MyPost[])
      setMyComments((commentsRes.data ?? []) as MyComment[])
      const posts = (heartsRes.data ?? [])
        .map((h: unknown) => (h as { posts: MyPost }).posts)
        .filter(Boolean)
      setMyHearts(posts as MyPost[])
      setLoading(false)
    })

    return () => { alive = false }
  }, [user])

  async function deletePost(postId: string) {
    if (!user) return
    if (!confirm('이 글을 삭제할까요? 복구할 수 없어요.')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)
    if (error) { alert(error.message); return }
    setMyPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const tabs: { k: Tab; label: string; count: number }[] = [
    { k: 'posts', label: '내 글', count: myPosts.length },
    { k: 'comments', label: '댓글', count: myComments.length },
    { k: 'hearts', label: '좋아요', count: myHearts.length },
  ]

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
          padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 8px',
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
            MY POSTS
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: '2px solid #111', flexShrink: 0 }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.k}
            onClick={() => setActiveTab(tab.k)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderLeft: i > 0 ? '2px solid #111' : 'none',
              background: activeTab === tab.k ? '#111' : 'var(--paper-2)',
              color: activeTab === tab.k ? '#FAFAF7' : '#111',
              cursor: 'pointer',
              fontFamily: gbStyles.font,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.7 }}>{tab.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: gbStyles.fontEn }}>
              {loading ? '…' : tab.count}
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 14 }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--ink-2)',
              fontSize: 12,
              padding: '32px 0',
            }}
          >
            불러오는 중...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeTab === 'posts' && (
              myPosts.length === 0
                ? <EmptyMsg text="아직 작성한 글이 없어요." />
                : myPosts.map((p) => (
                    <PostRow
                      key={p.id}
                      post={p}
                      onOpen={() => navigate(`/post/${p.id}`)}
                      onDelete={() => deletePost(p.id)}
                    />
                  ))
            )}
            {activeTab === 'comments' && (
              myComments.length === 0
                ? <EmptyMsg text="아직 작성한 댓글이 없어요." />
                : myComments.map((c) => (
                    <CommentRow
                      key={c.id}
                      comment={c}
                      onOpen={() => navigate(`/post/${c.post_id}`)}
                    />
                  ))
            )}
            {activeTab === 'hearts' && (
              myHearts.length === 0
                ? <EmptyMsg text="좋아요 한 글이 없어요." />
                : myHearts.map((p) => (
                    <PostRow
                      key={p.id}
                      post={p}
                      onOpen={() => navigate(`/post/${p.id}`)}
                    />
                  ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        color: 'var(--ink-2)',
        fontSize: 12,
        padding: '32px 0',
        opacity: 0.6,
        fontFamily: gbStyles.font,
      }}
    >
      {text}
    </div>
  )
}
