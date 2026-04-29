// Game Boy / pixel-style — AUTH + PROFILE + DETAIL screens
// LoginGB: phone → OTP → ID setup
// ProfileGB: user info, posts, settings
// PostDetailGB: full post with comments + hearts
// LocationSearchGB: 시/구 picker for HOME location change
// AuthWall: shown when guest tries to enter community/post

// ─── LOGIN flow ───────────────────────────────────────────
function LoginGB({ onDone, onBack }) {
  const [step, setStep] = React.useState('phone'); // phone | otp | id
  const [phone, setPhone] = React.useState('010-');
  const [otp, setOtp]     = React.useState('');
  const [userId, setId]   = React.useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>LOGIN</div>
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.6 }}>STEP {step === 'phone' ? '1' : step === 'otp' ? '2' : '3'}/3</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>

        {/* Trainer card preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <PixelBorder color="#111" bg="var(--red)" padding={0} style={{ width: 110 }}>
            <div style={{ padding: '14px 8px', textAlign: 'center', color: '#FAFAF7' }}>
              <Sprite kind="ball" size={36} dark/>
              <div style={{ fontSize: 9, marginTop: 6, letterSpacing: 2, fontFamily: gbStyles.fontEn }}>TRAINER</div>
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700 }}>{userId || '?????'}</div>
            </div>
          </PixelBorder>
        </div>

        {step === 'phone' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 핸드폰 번호</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>인증번호를 문자로 받게 돼요.</div>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={{
              width: '100%', padding: '8px 10px', border: '2px solid #111', boxSizing: 'border-box',
              fontFamily: gbStyles.fontEn, fontSize: 14, fontWeight: 700, background: 'var(--paper)', outline: 'none',
            }}/>
            <div style={{ marginTop: 10 }}>
              <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => setStep('otp')}>인증번호 받기 ▶</PixelButton>
            </div>
          </PixelBorder>
        )}

        {step === 'otp' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 인증번호 6자리</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>{phone} 으로 발송됨 · 02:59</div>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" style={{
              width: '100%', padding: '8px 10px', border: '2px solid #111', boxSizing: 'border-box',
              fontFamily: gbStyles.fontEn, fontSize: 18, fontWeight: 700, background: 'var(--paper)', outline: 'none',
              letterSpacing: 6, textAlign: 'center',
            }}/>
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <PixelButton sm color="#111" bg="var(--paper)" onClick={() => setStep('phone')}>◀ 뒤로</PixelButton>
              <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => setStep('id')}>확인 ▶</PixelButton>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, opacity: 0.6, textAlign: 'center' }}>다시 받기 · 음성으로 받기</div>
          </PixelBorder>
        )}

        {step === 'id' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 트레이너 아이디</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>커뮤니티에 표시될 이름이에요.</div>
            <input value={userId} onChange={e => setId(e.target.value.slice(0,12))} placeholder="ex) 피카츄러버" style={{
              width: '100%', padding: '8px 10px', border: '2px solid #111', boxSizing: 'border-box',
              fontFamily: gbStyles.font, fontSize: 14, fontWeight: 700, background: 'var(--paper)', outline: 'none',
            }}/>
            <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>2~12자 · 한글/영문/숫자</div>
            <div style={{ marginTop: 10 }}>
              <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => onDone && onDone(userId || '트레이너#9999')}>가입 완료 ▶</PixelButton>
            </div>
          </PixelBorder>
        )}

        <div style={{ fontSize: 9, opacity: 0.5, textAlign: 'center', letterSpacing: 1 }}>
          가입 시 이용약관 및 개인정보처리방침에 동의합니다.
        </div>
      </div>
    </div>
  );
}

// ─── AUTH WALL ────────────────────────────────────────────
function AuthWall({ onLogin, onBack, what = 'community' }) {
  const msg = what === 'community'
    ? '커뮤니티는 로그인 후 이용할 수 있어요.'
    : '글쓰기는 로그인 후 이용할 수 있어요.';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>SIGN IN</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Sprite kind="mega" size={48}/>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>{msg}</div>
        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>
          지도 보기는 로그인 없이도 가능해요.<br/>커뮤니티 활동을 위해 가입해 주세요.
        </div>
        <div style={{ width: '100%', maxWidth: 220, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={onLogin}>로그인 / 가입 ▶</PixelButton>
          <PixelButton full color="#111" bg="var(--paper)" onClick={onBack}>지도로 돌아가기</PixelButton>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────
function ProfileGB({ user, onNav, onLogout }) {
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState({
    id:     user?.id     || '피카츄러버',
    phone:  user?.phone  || '010-1234-5678',
    region: user?.region || '서울 강남구 역삼동',
    notify: '신상 입고, 댓글 ON',
  });
  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onNav && onNav('home')} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>PROFILE</div>
          <div style={{ flex: 1 }}/>
          <PixelButton sm color="#111" bg={editing ? 'var(--red)' : 'var(--paper)'} fg={editing ? '#FAFAF7' : '#111'} onClick={() => setEditing(e => !e)}>
            {editing ? '✓ 저장' : '✎ 편집'}
          </PixelButton>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

        {/* Trainer card */}
        <PixelBorder color="#111" bg="var(--red)" padding={0}>
          <div style={{ padding: '14px 16px', color: '#FAFAF7', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 64, height: 64, background: '#FAFAF7', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sprite kind="person" size={44}/>
              {editing && (
                <button title="프로필 사진 변경" style={{
                  position: 'absolute', bottom: -8, right: -8, width: 24, height: 24,
                  border: '2px solid #111', background: 'var(--paper)', cursor: 'pointer',
                  fontFamily: gbStyles.font, fontSize: 11, fontWeight: 700, color: '#111',
                  boxShadow: '2px 2px 0 0 #111',
                }}>✎</button>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.85, fontFamily: gbStyles.fontEn }}>TRAINER</div>
              {editing ? (
                <input value={profile.id} onChange={e => set('id', e.target.value.slice(0, 12))} style={{
                  marginTop: 2, width: '100%', padding: '4px 6px',
                  border: '2px solid #111', background: '#FAFAF7', color: '#111',
                  fontFamily: gbStyles.font, fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                }}/>
              ) : (
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{profile.id}</div>
              )}
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>가입 2026.04.10 · LV.3</div>
            </div>
          </div>
        </PixelBorder>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[{k:'쓴 글',v:'7'},{k:'하트',v:'48'},{k:'댓글',v:'15'}].map(s => (
            <PixelBorder key={s.k} color="#111" bg="var(--paper)" padding={8} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--ink-2)' }}>{s.k}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: gbStyles.fontEn }}>{s.v}</div>
            </PixelBorder>
          ))}
        </div>

        {/* Account info */}
        <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
          <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 6, fontFamily: gbStyles.fontEn }}>ACCOUNT</div>
          <EditableRow k="아이디" v={profile.id}     editing={editing} onChange={(v) => set('id', v)}/>
          <EditableRow k="번호"   v={profile.phone}  editing={editing} onChange={(v) => set('phone', v)}/>
          <EditableRow k="지역"   v={profile.region} editing={editing} onChange={(v) => set('region', v)}/>
          <EditableRow k="알림"   v={profile.notify} editing={editing} onChange={(v) => set('notify', v)}/>
        </PixelBorder>

        {/* My posts */}
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          <div style={{ background: '#111', color: 'var(--paper)', padding: '4px 8px', fontSize: 10, letterSpacing: 2 }}>MY POSTS</div>
          {window.COMMUNITY.slice(0, 2).map(p => (
            <div key={p.id} style={{ padding: '8px 10px', borderTop: '1px dashed rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 9, padding: '1px 5px', border: '2px solid #111', background: p.tag==='질문'?'var(--paper)':'var(--red)', color: p.tag==='질문'?'#111':'#FAFAF7', letterSpacing: 1, fontWeight: 700 }}>{p.tag==='질문'?'? 질문':'★ 소식'}</span>
                <span style={{ fontSize: 9, color: 'var(--ink-2)' }}>{p.loc}</span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 9, color: 'var(--ink-2)', fontFamily: gbStyles.fontEn }}>{p.mins}m</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>{p.t}</div>
            </div>
          ))}
        </PixelBorder>

        {/* Settings list */}
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          {['공지사항', '문의하기', '약관 / 정책', '버전 v0.1'].map(x => (
            <div key={x} style={{ padding: '10px 12px', borderBottom: '1px dashed rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', fontSize: 12 }}>
              <span style={{ flex: 1 }}>{x}</span>
              <span style={{ opacity: 0.5 }}>▶</span>
            </div>
          ))}
        </PixelBorder>

        <PixelButton full color="#111" bg="var(--paper)" onClick={onLogout}>로그아웃</PixelButton>
      </div>
    </div>
  );
}

function EditableRow({ k, v, editing, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize: 11, padding: '4px 0', borderBottom: '1px dashed rgba(0,0,0,0.2)' }}>
      <div style={{ width: 56, color: 'var(--ink-2)', letterSpacing: 1, fontSize: 10, flexShrink: 0 }}>{k}</div>
      {editing ? (
        <input value={v} onChange={e => onChange(e.target.value)} style={{
          flex: 1, padding: '3px 6px', border: '2px solid #111', background: 'var(--paper)',
          fontFamily: gbStyles.font, fontSize: 11, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
        }}/>
      ) : (
        <div style={{ flex: 1, fontWeight: 700 }}>{v}</div>
      )}
    </div>
  );
}

// ─── POST DETAIL — full body + comments + hearts ──────────
function PostDetailGB({ post, onBack, onNav }) {
  const [hearted, setHeart] = React.useState(false);
  const [draft, setDraft]   = React.useState('');
  const [hearts, setHearts] = React.useState(post.hearts || 0);
  const [comments, setComments] = React.useState(post.comments || []);
  const isAsk = post.tag === '질문';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>POST</div>
          <div style={{ flex: 1 }}/>
          <button style={{ background: 'transparent', border: '2px solid #111', padding: '4px 8px', cursor: 'pointer', fontFamily: gbStyles.font, fontSize: 10 }}>⋯</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Body */}
        <div style={{ padding: 14, borderBottom: '2px solid #111' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 9, padding: '1px 5px', border: '2px solid #111', background: isAsk?'var(--paper)':'var(--red)', color: isAsk?'#111':'#FAFAF7', letterSpacing: 1, fontWeight: 700 }}>{isAsk?'? 질문':'★ 소식'}</span>
            <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>{post.loc} · {post.dong}</span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 9, color: 'var(--ink-2)', fontFamily: gbStyles.fontEn }}>{post.mins}m</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>{post.t}</div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>{post.body || '(본문이 없습니다.)'}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
            <div style={{ width: 24, height: 24, background: 'var(--paper-2)', border: '2px solid #111', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sprite kind="ball" size={14}/>
            </div>
            <span style={{ fontWeight: 700 }}>{post.who}</span>
            <div style={{ flex: 1 }}/>
            <button onClick={() => { setHeart(h => !h); setHearts(h => hearted ? h-1 : h+1); }} style={{
              padding: '4px 10px', border: '2px solid #111',
              background: hearted ? 'var(--red)' : 'var(--paper)',
              color: hearted ? '#FAFAF7' : '#111',
              cursor: 'pointer', fontFamily: gbStyles.font, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {hearted ? '♥' : '♡'} {hearts}
            </button>
            <div style={{ padding: '4px 10px', border: '2px solid #111', background: 'var(--paper)', fontSize: 11, fontWeight: 700, display:'flex', alignItems:'center', gap: 4 }}>
              💬 {comments.length}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: gbStyles.fontEn, fontWeight: 700 }}>COMMENTS · {comments.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.map((c, i) => (
              <PixelBorder key={i} color="#111" bg="var(--paper-2)" padding={0}>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, fontSize: 10 }}>
                    <span style={{ fontWeight: 700 }}>{c.who}</span>
                    <div style={{ flex: 1 }}/>
                    <span style={{ color: 'var(--ink-2)', fontFamily: gbStyles.fontEn }}>{c.mins}m</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.t}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 10, fontSize: 9, color: 'var(--ink-2)' }}>
                    <span style={{ cursor: 'pointer' }}>♡ 0</span>
                    <span style={{ cursor: 'pointer' }}>답글</span>
                  </div>
                </div>
              </PixelBorder>
            ))}
            {comments.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>
                아직 댓글이 없어요. 첫 댓글을 남겨보세요!
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 8 }}/>
      </div>

      {/* Comment composer */}
      <div style={{ borderTop: '2px solid #111', padding: 8, background: 'var(--paper-2)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="댓글 달기..." style={{
          flex: 1, padding: '6px 10px', border: '2px solid #111', boxSizing: 'border-box',
          fontFamily: gbStyles.font, fontSize: 12, background: 'var(--paper)', outline: 'none',
        }}/>
        <PixelButton sm color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => {
          if (!draft.trim()) return;
          setComments(cs => [...cs, { who: '나', t: draft, mins: 0 }]);
          setDraft('');
        }}>등록</PixelButton>
      </div>
    </div>
  );
}

// ─── LOCATION SEARCH (HOME 위치 변경) ──────────────────────
function LocationSearchGB({ current, onPick, onBack }) {
  const [q, setQ] = React.useState('');
  const recents = ['서울 강남구 역삼동', '서울 서초구 서초동', '서울 마포구 합정동'];
  const all = window.REGIONS.flatMap(r => r.districts.map(d => ({ city: r.city, district: d })));
  const filtered = q ? all.filter(x => (x.city + ' ' + x.district).includes(q)) : all;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>LOCATION</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
              <span style={{ fontSize: 12 }}>Q</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="동/구/시 이름 검색" style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: gbStyles.font, fontSize: 12,
              }}/>
              {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>✕</button>}
            </div>
          </PixelBorder>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 0 }}>
        {!q && (
          <>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-2)', marginBottom: 6, fontFamily: gbStyles.fontEn }}>RECENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {recents.map(r => (
                <button key={r} onClick={() => onPick && onPick(r)} style={{
                  textAlign: 'left', padding: '8px 10px', border: '2px solid #111', background: 'var(--paper)',
                  cursor: 'pointer', fontFamily: gbStyles.font, fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>↻</span>
                  <span style={{ flex: 1 }}>{r}</span>
                  {r === current && <span style={{ fontSize: 9, padding: '1px 4px', background: '#111', color: '#FAFAF7' }}>현재</span>}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-2)', marginBottom: 6, fontFamily: gbStyles.fontEn }}>ALL</div>
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((x, i) => (
            <button key={i} onClick={() => onPick && onPick(`${x.city} ${x.district}`)} style={{
              textAlign: 'left', padding: '8px 10px', border: '2px solid #111', background: 'var(--paper)',
              cursor: 'pointer', fontFamily: gbStyles.font, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 10, opacity: 0.6, width: 28 }}>{x.city}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{x.district}</span>
              <span style={{ opacity: 0.5 }}>▶</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>검색 결과가 없어요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginGB, AuthWall, ProfileGB, PostDetailGB, LocationSearchGB });
