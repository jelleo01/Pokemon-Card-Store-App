import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

export default function InquiryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contact, setContact] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (subject.trim().length < 2) {
      setErr('제목을 입력해주세요.')
      return
    }
    if (body.trim().length < 5) {
      setErr('내용을 5자 이상 적어주세요.')
      return
    }
    setErr(null)
    setSubmitting(true)
    const { error } = await supabase.from('inquiries').insert({
      user_id: user?.id ?? null,
      subject: subject.trim(),
      body: body.trim(),
      contact: contact.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      console.error('[inquiry]', error)
      setErr(error.message)
      return
    }
    setDone(true)
    setSubject('')
    setBody('')
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
          <BackButton onClick={() => navigate(-1)} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            INQUIRY
          </div>
        </div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, letterSpacing: 1 }}>
          ※ 문의 내용은 관리자에게 전달돼요
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
        {done ? (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={20}>
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  border: '3px solid #111',
                  background: '#1a8a3e',
                  color: '#FAFAF7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  fontWeight: 700,
                  boxShadow: '3px 3px 0 0 #111',
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#1a8a3e',
                  fontFamily: gbStyles.fontEn,
                  letterSpacing: 1,
                }}
              >
                전송 완료!
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ink-2)',
                  lineHeight: 1.5,
                }}
              >
                관리자가 확인 후 연락드릴게요.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PixelButton color="#111" bg="var(--paper)" onClick={() => setDone(false)}>
                  추가 문의
                </PixelButton>
                <PixelButton
                  color="#111"
                  bg="var(--red)"
                  fg="#FAFAF7"
                  onClick={() => navigate(-1)}
                >
                  돌아가기
                </PixelButton>
              </div>
            </div>
          </PixelBorder>
        ) : (
          <>
            <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 제목</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 60))}
                placeholder="예) 매장 정보 수정 요청"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #111',
                  boxSizing: 'border-box',
                  fontFamily: gbStyles.font,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--paper)',
                  outline: 'none',
                }}
              />
            </PixelBorder>

            <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 내용</div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 1000))}
                placeholder="문의하실 내용을 자세히 적어주세요."
                style={{
                  width: '100%',
                  minHeight: 140,
                  padding: 10,
                  border: '2px solid #111',
                  boxSizing: 'border-box',
                  fontFamily: gbStyles.font,
                  fontSize: 12,
                  lineHeight: 1.5,
                  background: 'var(--paper)',
                  outline: 'none',
                  resize: 'vertical',
                  color: 'var(--ink)',
                }}
              />
              <div
                style={{
                  fontSize: 9,
                  marginTop: 4,
                  textAlign: 'right',
                  color: 'var(--ink-2)',
                  fontFamily: gbStyles.fontEn,
                }}
              >
                {body.length}/1000
              </div>
            </PixelBorder>

            <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                ▶ 회신 받을 곳 (선택)
              </div>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 80))}
                placeholder="이메일 또는 전화번호"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #111',
                  boxSizing: 'border-box',
                  fontFamily: gbStyles.font,
                  fontSize: 12,
                  background: 'var(--paper)',
                  outline: 'none',
                }}
              />
            </PixelBorder>

            {err && (
              <div
                style={{
                  padding: '8px 10px',
                  border: '2px solid var(--red)',
                  background: '#FCE7E7',
                  color: 'var(--red)',
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                ✕ {err}
              </div>
            )}

            <PixelButton
              full
              color="#111"
              bg="var(--red)"
              fg="#FAFAF7"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? '전송 중...' : '전송 ▶'}
            </PixelButton>
          </>
        )}
      </div>
    </div>
  )
}
