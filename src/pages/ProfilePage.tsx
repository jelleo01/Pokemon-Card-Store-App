import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import EditableRow from '@/components/ui/EditableRow'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { COMMUNITY } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'

interface ProfileShape {
  id: string
  phone: string
  region: string
  notify: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileShape>({
    id: user?.id || '피카츄러버',
    phone: user?.phone || '010-1234-5678',
    region: user?.region || '서울 강남구 역삼동',
    notify: '신상 입고, 댓글 ON',
  })
  const set = (k: keyof ProfileShape, v: string) =>
    setProfile((p) => ({ ...p, [k]: v }))

  function toggleEdit() {
    if (editing) {
      updateUser({ id: profile.id, phone: profile.phone, region: profile.region })
    }
    setEditing((e) => !e)
  }

  function handleLogout() {
    signOut()
    navigate('/')
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
          <BackButton onClick={() => navigate('/')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            PROFILE
          </div>
          <div style={{ flex: 1 }} />
          <PixelButton
            sm
            color="#111"
            bg={editing ? 'var(--red)' : 'var(--paper)'}
            fg={editing ? '#FAFAF7' : '#111'}
            onClick={toggleEdit}
          >
            {editing ? '✓ 저장' : '✎ 편집'}
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
        {/* Trainer card */}
        <PixelBorder color="#111" bg="var(--red)" padding={0}>
          <div
            style={{
              padding: '14px 16px',
              color: '#FAFAF7',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 64,
                height: 64,
                background: '#FAFAF7',
                border: '2px solid #111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sprite kind="person" size={44} />
              {editing && (
                <button
                  title="프로필 사진 변경"
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#111',
                    boxShadow: '2px 2px 0 0 #111',
                  }}
                >
                  ✎
                </button>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 2,
                  opacity: 0.85,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                TRAINER
              </div>
              {editing ? (
                <input
                  value={profile.id}
                  onChange={(e) => set('id', e.target.value.slice(0, 12))}
                  style={{
                    marginTop: 2,
                    width: '100%',
                    padding: '4px 6px',
                    border: '2px solid #111',
                    background: '#FAFAF7',
                    color: '#111',
                    fontFamily: gbStyles.font,
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{profile.id}</div>
              )}
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>
                가입 2026.04.10 · LV.3
              </div>
            </div>
          </div>
        </PixelBorder>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: '쓴 글', v: '7' },
            { k: '하트', v: '48' },
            { k: '댓글', v: '15' },
          ].map((s) => (
            <PixelBorder
              key={s.k}
              color="#111"
              bg="var(--paper)"
              padding={8}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 1,
                  color: 'var(--ink-2)',
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                {s.v}
              </div>
            </PixelBorder>
          ))}
        </div>

        {/* Account info */}
        <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 6,
              fontFamily: gbStyles.fontEn,
            }}
          >
            ACCOUNT
          </div>
          <EditableRow
            k="아이디"
            v={profile.id}
            editing={editing}
            onChange={(v) => set('id', v)}
          />
          <EditableRow
            k="번호"
            v={profile.phone}
            editing={editing}
            onChange={(v) => set('phone', v)}
          />
          <EditableRow
            k="지역"
            v={profile.region}
            editing={editing}
            onChange={(v) => set('region', v)}
          />
          <EditableRow
            k="알림"
            v={profile.notify}
            editing={editing}
            onChange={(v) => set('notify', v)}
          />
        </PixelBorder>

        {/* My posts */}
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          <div
            style={{
              background: '#111',
              color: 'var(--paper)',
              padding: '4px 8px',
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            MY POSTS
          </div>
          {COMMUNITY.slice(0, 2).map((p) => (
            <div
              key={p.id}
              style={{
                padding: '8px 10px',
                borderTop: '1px dashed rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    border: '2px solid #111',
                    background: p.tag === '질문' ? 'var(--paper)' : 'var(--red)',
                    color: p.tag === '질문' ? '#111' : '#FAFAF7',
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  {p.tag === '질문' ? '? 질문' : '★ 소식'}
                </span>
                <span style={{ fontSize: 9, color: 'var(--ink-2)' }}>{p.loc}</span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--ink-2)',
                    fontFamily: gbStyles.fontEn,
                  }}
                >
                  {p.mins}m
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>{p.t}</div>
            </div>
          ))}
        </PixelBorder>

        {/* Settings list */}
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          {['공지사항', '문의하기', '약관 / 정책', '버전 v0.1'].map((x) => (
            <div
              key={x}
              style={{
                padding: '10px 12px',
                borderBottom: '1px dashed rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1 }}>{x}</span>
              <span style={{ opacity: 0.5 }}>▶</span>
            </div>
          ))}
        </PixelBorder>

        <PixelButton full color="#111" bg="var(--paper)" onClick={handleLogout}>
          로그아웃
        </PixelButton>
      </div>
    </div>
  )
}
