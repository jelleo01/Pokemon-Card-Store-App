import { usePoints } from '@/hooks/usePoints'
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
  userId: string
  body: string
  category: 'news' | 'ask'
  hearts_count: number
  created_at: string
  who: string
  loc: string
  dong: string
  shop_name: string
}

type ReportTarget = { type: 'post'; id: string; authorId: string } | { type: 'comment'; id: string; authorId: string }

const REPORT_REASONS = ['스팸 / 광고', '부적절한 내용', '욕설 / 혐오 표현', '허위 정보']

interface CommentRow {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles: { trainer_id: string } | null
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

export default function PostDetailPage() {
  const { refreshPoints } = usePoints()
  const [liking, setLiking] = useState(false)
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

  // 신고
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // 차단
  const [blockTarget, setBlockTarget] = useState<{ userId: string; name: string } | null>(null)
  const [blockSubmitting, setBlockSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setNotFound(false)

    ;(async () => {
      // 1) post 본문
      const { data: postRow, error: postErr } = await supabase
        .from('posts')
        .select('id, body, category, hearts_count, created_at, user_id, shop_id')
        .eq('id', id)
        .maybeSingle()
      if (!alive) return
      if (postErr) {
        console.error('[post detail]', postErr)
        setNotFound(true)
        setLoading(false)
        return
      }
      if (!postRow) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // 2) 작성자 프로필 + 매장 (있으면) 병렬
      const [profileRes, shopRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('trainer_id')
          .eq('id', postRow.user_id)
          .maybeSingle(),
        postRow.shop_id
          ? supabase
              .from('shops')
              .select('name, city, district, dong')
              .eq('id', postRow.shop_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])
      if (!alive) return
      if (profileRes.error) console.error('[post profile]', profileRes.error)
      if (shopRes.error) console.error('[post shop]', shopRes.error)

      const profile = profileRes.data as { trainer_id: string } | null
      const shop = shopRes.data as
        | { name: string; city: string | null; district: string | null; dong: string | null }
        | null

      setPost({
        id: postRow.id,
        userId: postRow.user_id,
        body: postRow.body,
        category: postRow.category,
        hearts_count: postRow.hearts_count ?? 0,
        created_at: postRow.created_at,
        who: profile?.trainer_id ?? '익명',
        loc: shop?.district ?? shop?.city ?? '',
        dong: shop?.dong ?? '',
        shop_name: shop?.name ?? '',
      })
      setHearts(postRow.hearts_count ?? 0)
      setLoading(false)
    })().catch((e) => {
      if (!alive) return
      console.error('[post detail unexpected]', e)
      setNotFound(true)
      setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      const { data: rows, error } = await supabase
        .from('comments')
        .select('id, body, created_at, user_id')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      if (!alive) return
      if (error) {
        console.error('[comments fetch]', error)
        return
      }
      const list = (rows ?? []) as Omit<CommentRow, 'profiles'>[]
      const userIds = Array.from(new Set(list.map((c) => c.user_id)))
      const profileMap = new Map<string, { trainer_id: string }>()
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, trainer_id')
          .in('id', userIds)
        if (pErr) console.error('[comments profiles]', pErr)
        for (const p of (profiles ?? []) as { id: string; trainer_id: string }[]) {
          profileMap.set(p.id, { trainer_id: p.trainer_id })
        }
      }
      if (!alive) return
      setComments(
        list.map((c) => ({
          ...c,
          profiles: profileMap.get(c.user_id) ?? null,
        })),
      )
    })()
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
    if (!id || !user || liking) return
    setLiking(true)
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
    setLiking(false)
    void refreshPoints()
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function submitReport() {
    if (!reportTarget || !user) return
    setReportSubmitting(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: reportTarget.type,
      target_id: reportTarget.id,
      author_id: reportTarget.authorId,
      reason: reportReason || '기타',
    })
    setReportSubmitting(false)
    setReportTarget(null)
    setReportReason('')
    if (error) {
      showToast('신고 처리 중 오류가 발생했어요.')
    } else {
      showToast('신고가 접수되었어요.')
    }
  }

  async function deleteComment(commentId: string) {
    if (!user) return
    if (!confirm('댓글을 삭제할까요?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id)
    if (error) { alert(error.message); return }
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  async function handleDeletePost() {
    if (!id || !user || !post) return
    if (!confirm('이 글을 삭제할까요? 복구할 수 없어요.')) return
    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id)
    if (error) { alert(error.message); return }
    navigate('/community')
  }

  async function confirmBlock() {
    if (!blockTarget || !user) return
    setBlockSubmitting(true)
    await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: blockTarget.userId,
    })
    setBlockSubmitting(false)
    setBlockTarget(null)
    showToast(`${blockTarget.name} 트레이너를 차단했어요.`)
    navigate('/community')
  }

  async function submitComment() {
    if (!id || !user || submitting) return
    const text = draft.trim()
    if (!text) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, body: text })
      .select('id, body, created_at, user_id')
      .single()
    setSubmitting(false)
    if (error) {
      alert(error.message)
      return
    }
    // 작성자 닉네임은 useAuth 의 trainerId 사용 (별도 query 불필요)
    const inserted = data as Omit<CommentRow, 'profiles'>
    setComments((cs) => [
      ...cs,
      {
        ...inserted,
        profiles: user.trainerId ? { trainer_id: user.trainerId } : null,
      },
    ])
    setDraft('')
    void refreshPoints()
    if (post?.userId !== user.id && post?.category === 'news') showToast('댓글 등록 완료! +1 P')
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
          padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackButton onClick={() => navigate('/community')} />
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.3,
              fontFamily: post.shop_name ? gbStyles.fontReadable : gbStyles.fontEn,
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
                fontSize: 10,
                padding: '1px 6px',
                border: '2px solid #111',
                background: isAsk ? 'var(--paper)' : 'var(--red)',
                color: isAsk ? '#111' : '#FAFAF7',
                letterSpacing: 0.5,
                fontWeight: 700,
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {isAsk ? '? 질문' : '★ 소식'}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {post.loc}
              {post.dong ? ' · ' + post.dong : ''}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 10,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontReadable,
              }}
            >
              {timeAgo(post.created_at)}
            </span>
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.45,
              marginBottom: 8,
              fontFamily: gbStyles.fontReadable,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              fontFamily: gbStyles.fontReadable,
            }}
          >
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
            <span style={{ fontWeight: 700, fontFamily: gbStyles.fontReadable, fontSize: 13 }}>
              {post.who}
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={toggleHeart}
              disabled={liking || !user}
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
            {user && post.userId === user.id && (
              <button
                onClick={handleDeletePost}
                style={{
                  padding: '4px 8px',
                  border: '2px solid var(--red)',
                  background: 'var(--paper)',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: gbStyles.font,
                  color: 'var(--red)',
                }}
              >
                삭제
              </button>
            )}
            {user && post.userId !== user.id && (
              <>
                <button
                  onClick={() => setReportTarget({ type: 'post', id: post.id, authorId: post.userId })}
                  style={{
                    padding: '4px 8px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    color: '#111',
                  }}
                >
                  신고
                </button>
                <button
                  onClick={() => setBlockTarget({ userId: post.userId, name: post.who })}
                  style={{
                    padding: '4px 8px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    color: '#111',
                  }}
                >
                  차단
                </button>
              </>
            )}
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
                      marginBottom: 4,
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: gbStyles.fontReadable,
                      }}
                    >
                      {c.profiles?.trainer_id ?? '익명'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span
                      style={{
                        color: 'var(--ink-2)',
                        fontFamily: gbStyles.fontEn,
                        fontSize: 10,
                      }}
                    >
                      {timeAgo(c.created_at)}
                    </span>
                    {user && c.user_id === user.id && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: 9,
                          color: 'var(--red)',
                          cursor: 'pointer',
                          fontFamily: gbStyles.font,
                          padding: '0 2px',
                        }}
                      >
                        삭제
                      </button>
                    )}
                    {user && c.user_id !== user.id && (
                      <button
                        onClick={() => setReportTarget({ type: 'comment', id: c.id, authorId: c.user_id })}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: 9,
                          color: 'var(--ink-2)',
                          cursor: 'pointer',
                          fontFamily: gbStyles.font,
                          padding: '0 2px',
                        }}
                      >
                        신고
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: gbStyles.fontReadable,
                    }}
                  >
                    {c.body}
                  </div>
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
          padding: '10px 8px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--paper-2)',
          flexShrink: 0,
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? '다른 사람의 소식에 댓글 +1 P' : '로그인이 필요해요'}
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
            fontFamily: gbStyles.fontReadable,
            fontSize: 13,
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

      {/* 신고 모달 */}
      {reportTarget && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, padding: 24,
          }}
          onClick={() => setReportTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <div style={{ padding: '16px 20px', minWidth: 260 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, fontFamily: gbStyles.fontReadable }}>
                  {reportTarget.type === 'post' ? '게시글 신고' : '댓글 신고'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      style={{
                        padding: '7px 10px', border: '2px solid #111', textAlign: 'left',
                        background: reportReason === r ? '#111' : 'var(--paper)',
                        color: reportReason === r ? '#FAFAF7' : '#111',
                        fontSize: 12, cursor: 'pointer', fontFamily: gbStyles.fontReadable, fontWeight: 600,
                      }}
                    >
                      {reportReason === r ? '✓ ' : ''}{r}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <PixelButton full color="#111" bg="var(--paper)" onClick={() => setReportTarget(null)}>
                    취소
                  </PixelButton>
                  <PixelButton
                    full color="#111" bg="var(--red)" fg="#FAFAF7"
                    onClick={submitReport}
                    disabled={!reportReason || reportSubmitting}
                  >
                    {reportSubmitting ? '...' : '신고하기'}
                  </PixelButton>
                </div>
              </div>
            </PixelBorder>
          </div>
        </div>
      )}

      {/* 차단 확인 모달 */}
      {blockTarget && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, padding: 24,
          }}
          onClick={() => setBlockTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <div style={{ padding: '20px 24px', minWidth: 260 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: gbStyles.fontReadable }}>
                  트레이너 차단
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 16, fontFamily: gbStyles.fontReadable, color: 'var(--ink-2)' }}>
                  <b>{blockTarget.name}</b> 트레이너를 차단하면<br />
                  이 트레이너의 글이 피드에서 사라져요.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <PixelButton full color="#111" bg="var(--paper)" onClick={() => setBlockTarget(null)}>
                    취소
                  </PixelButton>
                  <PixelButton
                    full color="#111" bg="#111" fg="#FAFAF7"
                    onClick={confirmBlock}
                    disabled={blockSubmitting}
                  >
                    {blockSubmitting ? '...' : '차단하기'}
                  </PixelButton>
                </div>
              </div>
            </PixelBorder>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            background: '#111', color: '#FAFAF7',
            padding: '8px 16px', fontSize: 12, fontFamily: gbStyles.fontReadable,
            border: '2px solid #FAFAF7', whiteSpace: 'nowrap', zIndex: 70,
            boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
