import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { COMMUNITY, type Comment } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'

export default function PostDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const post = COMMUNITY.find((p) => p.id === id)

  const [hearted, setHeart] = useState(false)
  const [draft, setDraft] = useState('')
  const [hearts, setHearts] = useState(post?.hearts || 0)
  const [comments, setComments] = useState<Comment[]>(post?.comments || [])

  if (!post) {
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
        글을 찾을 수 없어요.
      </div>
    )
  }

  const isAsk = post.tag === '질문'

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
            }}
          >
            POST
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={{
              background: 'transparent',
              border: '2px solid #111',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: gbStyles.font,
              fontSize: 10,
            }}
          >
            ⋯
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Body */}
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
              {post.loc} · {post.dong}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 9,
                color: 'var(--ink-2)',
                fontFamily: gbStyles.fontEn,
              }}
            >
              {post.mins}m
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
            {post.t}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            {post.body || '(본문이 없습니다.)'}
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
              onClick={() => {
                setHeart((h) => !h)
                setHearts((h) => (hearted ? h - 1 : h + 1))
              }}
              style={{
                padding: '4px 10px',
                border: '2px solid #111',
                background: hearted ? 'var(--red)' : 'var(--paper)',
                color: hearted ? '#FAFAF7' : '#111',
                cursor: 'pointer',
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

        {/* Comments */}
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
            {comments.map((c, i) => (
              <PixelBorder key={i} color="#111" bg="var(--paper-2)" padding={0}>
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
                    <span style={{ fontWeight: 700 }}>{c.who}</span>
                    <div style={{ flex: 1 }} />
                    <span
                      style={{
                        color: 'var(--ink-2)',
                        fontFamily: gbStyles.fontEn,
                      }}
                    >
                      {c.mins}m
                    </span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.t}</div>
                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      gap: 10,
                      fontSize: 9,
                      color: 'var(--ink-2)',
                    }}
                  >
                    <span style={{ cursor: 'pointer' }}>♡ 0</span>
                    <span style={{ cursor: 'pointer' }}>답글</span>
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

      {/* Comment composer */}
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
          placeholder="댓글 달기..."
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
          onClick={() => {
            if (!draft.trim()) return
            setComments((cs) => [...cs, { who: '나', t: draft, mins: 0 }])
            setDraft('')
          }}
        >
          등록
        </PixelButton>
      </div>
    </div>
  )
}
