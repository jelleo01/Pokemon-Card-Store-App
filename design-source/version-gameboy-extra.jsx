// Game Boy / pixel-style — POST + COMMUNITY screens
// PostGB:      장소 선택(새/기존) + 카테고리(소식/질문) + 본문
// CommunityGB: 필터(최신/위치/찾기) + 글 리스트 + 질문 섹션

// ─── POST (글쓰기) ─────────────────────────────────────────
function PostGB({ onNav }) {
  const [tab, setTab]         = React.useState('post');
  const [placeMode, setPlace] = React.useState('existing'); // 'existing' | 'new'
  const [shopId, setShopId]   = React.useState('PC-001');
  const [category, setCat]    = React.useState('소식');     // '소식' | '질문'
  const [stockTag, setStock]  = React.useState('');         // 빠른 재고 태그
  const [body, setBody]       = React.useState('');
  const [pickerOpen, setPicker] = React.useState(false);
  const [pickerQ, setPickerQ]   = React.useState('');

  const open = window.SHOPS.find(s => s.id === shopId);
  const stockTags = ['신상 박스 입고', '잔여 적음', '품절', '재입고 예정', '싱글 카드'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>

      {/* Header — matches Map/Community paper-2 banner */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => onNav && onNav('home')} style={{ background: 'transparent', border: '2px solid #111', width: 28, height: 24, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: gbStyles.fontEn }}>POST</div>
          <div style={{ flex: 1 }}/>
          <PixelButton sm color="#111" bg="var(--red)" fg="#FAFAF7">등록 ▶</PixelButton>
        </div>
        <div style={{ fontSize: 10, marginTop: 6, opacity: 0.6, letterSpacing: 1 }}>※ 매장 소식 / 질문을 남겨보세요</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

        {/* 1. 장소 선택 */}
        <div>
          <SectionLabel n="01" label="장소 / PLACE"/>
          {/* 미니 지도 placeholder */}
          <PixelBorder color="#111" bg="var(--paper)" padding={0} style={{ marginBottom: 8 }}>
            <div style={{ position: 'relative', height: 100, overflow: 'hidden', background: '#EEECE2', ...dither }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
                <defs>
                  <pattern id="post-streets" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M0 5 H10 M5 0 V10" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#post-streets)"/>
                <rect x="0" y="46" width="100" height="6" fill="rgba(230,57,70,0.18)"/>
                <rect x="44" y="0" width="6" height="100" fill="rgba(230,57,70,0.18)"/>
              </svg>
              {/* show selected pin */}
              {placeMode === 'existing' && open && (
                <div style={{ position:'absolute', left:`${open.x}%`, top:`${open.y}%`, transform:'translate(-50%,-100%)' }}>
                  <div style={{ padding: '2px 4px', background: '#111', color: '#FAFAF7', border: '2px solid #111', fontSize: 9, fontWeight: 700, boxShadow:'2px 2px 0 0 #111' }}>{open.name.split(' ')[0]}</div>
                </div>
              )}
              {placeMode === 'new' && (
                <div style={{ position:'absolute', left:'50%', top:'55%', transform:'translate(-50%,-50%)' }}>
                  <div style={{ width: 14, height: 14, background: 'var(--red)', border: '2px solid #111', boxShadow: '0 0 0 4px rgba(230,57,70,0.25)' }}/>
                  <div style={{ marginTop: 2, fontSize: 9, fontWeight: 700, padding: '1px 4px', background: '#FAFAF7', border: '2px solid #111', whiteSpace: 'nowrap' }}>NEW</div>
                </div>
              )}
            </div>
          </PixelBorder>

          {/* mode toggle: 새 장소 / 이미 있음 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <ModeToggle active={placeMode === 'existing'} onClick={() => setPlace('existing')}>이미 있음</ModeToggle>
            <ModeToggle active={placeMode === 'new'}      onClick={() => setPlace('new')}>새 장소</ModeToggle>
          </div>

          {placeMode === 'existing' ? (
            <PixelBorder color="#111" bg="var(--paper-2)" padding={0}>
              {/* Selected shop summary + open search */}
              <button onClick={() => setPicker(o => !o)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: gbStyles.font, textAlign: 'left',
              }}>
                <TypePin type={open.type} size={14}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{open.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, fontFamily: gbStyles.fontEn }}>{open.dist}km · {open.type} · {open.addr}</div>
                </div>
                <span style={{ fontSize: 10, padding: '3px 6px', border: '2px solid #111', background: 'var(--paper)' }}>변경 ▼</span>
              </button>
              {pickerOpen && (
                <div style={{ borderTop: '2px solid #111' }}>
                  {/* Search input */}
                  <div style={{ padding: '8px 10px', background: 'var(--paper)', borderBottom: '1px dashed rgba(0,0,0,0.2)' }}>
                    <PixelBorder color="#111" bg="var(--paper)" padding={0}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px' }}>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                        <input autoFocus value={pickerQ} onChange={e => setPickerQ(e.target.value)} placeholder="매장 이름 / 주소 검색" style={{
                          flex: 1, border: 'none', outline: 'none', background: 'transparent',
                          fontFamily: gbStyles.font, fontSize: 11,
                        }}/>
                        {pickerQ && <button onClick={() => setPickerQ('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11 }}>✕</button>}
                      </div>
                    </PixelBorder>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {(() => {
                      const list = pickerQ
                        ? window.SHOPS.filter(s => s.name.includes(pickerQ) || s.addr.includes(pickerQ) || s.type.includes(pickerQ))
                        : window.SHOPS;
                      if (list.length === 0) return (
                        <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>
                          검색 결과가 없어요. <br/>「새 장소」로 등록해보세요.
                        </div>
                      );
                      return list.map(s => (
                        <button key={s.id} onClick={() => { setShopId(s.id); setPicker(false); setPickerQ(''); }} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                          background: s.id === shopId ? '#D9D7CF' : 'var(--paper)',
                          color: '#111',
                          border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.15)',
                          fontFamily: gbStyles.font, fontSize: 11,
                        }}>
                          <TypePin type={s.type} size={12}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                            <div style={{ fontSize: 9, opacity: 0.65, fontFamily: gbStyles.fontEn }}>{s.addr}</div>
                          </div>
                          <span style={{ fontSize: 9, opacity: 0.7, fontFamily: gbStyles.fontEn }}>{s.dist}km</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </PixelBorder>
          ) : (
            <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
              <Field label="이름">
                <PixelInput placeholder="예) 카드매니아 강남점"/>
              </Field>
              <Field label="주소">
                <PixelInput placeholder="지도에서 ▶ 핀 위치 지정"/>
              </Field>
              <Field label="분류">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {window.SHOP_TYPES.map((t, i) => (
                    <span key={t} style={{
                      fontSize: 9, padding: '3px 6px', border: '2px solid #111',
                      background: i === 3 ? '#111' : 'var(--paper)',
                      color: i === 3 ? '#FAFAF7' : '#111',
                      letterSpacing: 1, cursor: 'pointer',
                    }}>{t}</span>
                  ))}
                </div>
              </Field>
            </PixelBorder>
          )}
        </div>

        {/* 2. 카테고리 */}
        <div>
          <SectionLabel n="02" label="카테고리 / TYPE"/>
          <div style={{ display: 'flex', gap: 8 }}>
            <CategoryCard active={category === '소식'} onClick={() => setCat('소식')} icon="mega" title="소식" en="news" sub="신상 입고 / 재고 알림"/>
            <CategoryCard active={category === '질문'} onClick={() => setCat('질문')} icon="card" title="질문" en="ask"  sub="다른 트레이너에게"/>
          </div>
        </div>

        {/* 3. 빠른 태그 (only for 소식) */}
        {category === '소식' && (
          <div>
            <SectionLabel n="03" label="빠른 태그 / TAG"/>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stockTags.map(t => {
                const on = stockTag === t;
                return (
                  <button key={t} onClick={() => setStock(on ? '' : t)} style={{
                    fontSize: 10, padding: '4px 8px', border: '2px solid #111',
                    background: on ? 'var(--red)' : 'var(--paper)',
                    color: on ? '#FAFAF7' : '#111',
                    cursor: 'pointer', fontFamily: gbStyles.font, letterSpacing: 1,
                  }}>{on ? '☑ ' : '+ '}{t}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. 본문 */}
        <div>
          <SectionLabel n={category === '소식' ? '04' : '03'} label="내용 / BODY"/>
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={category === '소식' ? '예) 오늘 14시쯤 신상 박스 12개 입고됐어요. 1인 2박스 제한이래요.' : '예) 자판기 #14 재입고 언제쯤일까요?'}
              style={{
                width: '100%', minHeight: 90, border: 'none', outline: 'none', resize: 'none',
                background: 'transparent', padding: 10, boxSizing: 'border-box',
                fontFamily: gbStyles.font, fontSize: 12, lineHeight: 1.5, color: 'var(--ink)',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', borderTop: '2px solid #111', padding: '4px 8px', background: 'var(--paper-2)', gap: 8 }}>
              <PixelMiniBtn>📷 사진</PixelMiniBtn>
              <PixelMiniBtn>@ 매장태그</PixelMiniBtn>
              <div style={{ flex: 1 }}/>
              <span style={{ fontSize: 9, color: 'var(--ink-2)', fontFamily: gbStyles.fontEn }}>{body.length}/280</span>
            </div>
          </PixelBorder>
        </div>

        <div style={{ height: 8 }}/>
      </div>

      <GBTabBar active={tab} onTab={(t) => {
        if (t === 'home') onNav && onNav('home');
        if (t === 'map')  onNav && onNav('map');
        if (t === 'community') onNav && onNav('community');
        setTab(t);
      }}/>
    </div>
  );
}

// ─── COMMUNITY (커뮤니티) ───────────────────────────────────
function CommunityGB({ onNav, onOpenPost }) {
  const [tab, setTab]     = React.useState('community');
  const [filter, setFil]  = React.useState('latest'); // 'latest' | 'near' | 'find'
  const [city, setCity]   = React.useState('전체');
  const [district, setDistrict] = React.useState('전체');

  const allPosts = window.COMMUNITY;

  // City/district filter only applies when filter === 'near'
  const cityFiltered = filter === 'near'
    ? allPosts.filter(p => {
        if (city !== '전체' && !window.REGIONS.find(r => r.city === city)?.districts.includes(p.loc)) return false;
        if (district !== '전체' && p.loc !== district) return false;
        return true;
      })
    : allPosts;

  const feed = filter === 'find'
    ? cityFiltered.filter(p => p.tag === '질문')
    : filter === 'near'
      ? [...cityFiltered].sort((a, b) => a.loc.localeCompare(b.loc))
      : [...cityFiltered].sort((a, b) => a.mins - b.mins);

  const questions = allPosts.filter(p => p.tag === '질문');

  const cityObj = window.REGIONS.find(r => r.city === city);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sprite kind="mega" size={20}/>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>COMMUNITY</div>
          <div style={{ flex: 1 }}/>
          <PixelButton sm color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => onNav && onNav('post')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>+ 글쓰기</PixelButton>
        </div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, letterSpacing: 1 }}>※ 트레이너들의 매장 소식과 질문</div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        {[
          { id: 'latest', label: '최신',  en: 'LATEST' },
          { id: 'near',   label: '위치별', en: 'NEAR'   },
          { id: 'find',   label: '찾기',  en: 'FIND'   },
        ].map((f, i, a) => {
          const on = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFil(f.id)} style={{
              flex: 1, padding: '8px 0', cursor: 'pointer', border: 'none',
              borderRight: i === a.length - 1 ? 'none' : '2px solid #111',
              background: on ? '#111' : 'transparent',
              color: on ? '#FAFAF7' : '#111',
              fontFamily: gbStyles.font, fontSize: 11, letterSpacing: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span>{f.label}</span>
              <span style={{ fontSize: 8, opacity: 0.6, fontFamily: gbStyles.fontEn, letterSpacing: 2 }}>{f.en}</span>
            </button>
          );
        })}
      </div>

      {/* 위치별 sub-filter: 시 / 구 chips */}
      {filter === 'near' && (
        <div style={{ borderBottom: '2px solid #111', background: 'var(--paper-2)', padding: '8px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-2)', marginBottom: 4, fontFamily: gbStyles.fontEn }}>시 / CITY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {['전체', ...window.REGIONS.map(r => r.city)].map(c => {
              const on = city === c;
              return (
                <button key={c} onClick={() => { setCity(c); setDistrict('전체'); }} style={{
                  fontSize: 10, padding: '3px 8px', border: '2px solid #111',
                  background: on ? '#111' : 'var(--paper)', color: on ? '#FAFAF7' : '#111',
                  cursor: 'pointer', fontFamily: gbStyles.font, fontWeight: 700,
                }}>{c}</button>
              );
            })}
          </div>
          {cityObj && (
            <>
              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-2)', marginBottom: 4, fontFamily: gbStyles.fontEn }}>구 / DISTRICT</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['전체', ...cityObj.districts].map(d => {
                  const on = district === d;
                  return (
                    <button key={d} onClick={() => setDistrict(d)} style={{
                      fontSize: 10, padding: '3px 8px', border: '2px solid #111',
                      background: on ? '#D9D7CF' : 'var(--paper)', color: '#111',
                      cursor: 'pointer', fontFamily: gbStyles.font,
                    }}>{d}</button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {feed.map(p => <PostCard key={p.id} p={p} onClick={() => onOpenPost && onOpenPost(p)}/>)}
        {feed.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>
            해당 지역에 글이 아직 없어요.
          </div>
        )}

        {/* 질문 섹션 (latest일 때만 하단에 강조) */}
        {filter === 'latest' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 2, background: '#111' }}/>
              <div style={{ fontSize: 10, letterSpacing: 2, fontFamily: gbStyles.fontEn, fontWeight: 700 }}>? 질문 / Q&amp;A</div>
              <div style={{ flex: 1, height: 2, background: '#111' }}/>
            </div>
            {questions.slice(0, 2).map(p => <PostCard key={'q-' + p.id} p={p} compact onClick={() => onOpenPost && onOpenPost(p)}/>)}
          </>
        )}

        <div style={{ height: 8 }}/>
      </div>

      <GBTabBar active={tab} onTab={(t) => {
        if (t === 'home') onNav && onNav('home');
        if (t === 'map')  onNav && onNav('map');
        setTab(t);
      }}/>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────
function PostCard({ p, compact, onClick }) {
  const isAsk = p.tag === '질문';
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 0, border: 'none', background: 'transparent', textAlign: 'left',
      cursor: onClick ? 'pointer' : 'default',
    }}>
    <PixelBorder color="#111" bg={compact ? 'var(--paper-2)' : 'var(--paper)'} padding={0}>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 9, padding: '1px 5px', border: '2px solid #111',
            background: isAsk ? 'var(--paper)' : 'var(--red)',
            color: isAsk ? '#111' : '#FAFAF7',
            letterSpacing: 1, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
          }}>{isAsk ? '? 질문' : '★ 소식'}</span>
          <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>{p.loc}</span>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 9, color: 'var(--ink-2)', fontFamily: gbStyles.fontEn, letterSpacing: 1 }}>{p.mins}m</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>{p.t}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--ink-2)' }}>
          <span>by {p.who}</span>
          <div style={{ flex: 1 }}/>
          <span>♡ {p.hearts || 0}</span>
          <span>💬 {p.comments?.length || 0}</span>
        </div>
      </div>
    </PixelBorder>
    </button>
  );
}

function SectionLabel({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, padding: '2px 7px', background: '#111', color: '#FAFAF7', letterSpacing: 1, fontFamily: gbStyles.fontEn, fontWeight: 700 }}>{n}</span>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
    </div>
  );
}

function ModeToggle({ children, active, onClick }) {
  // Off = white, on = light gray. Keep 3D shadow press feel.
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '6px 10px', cursor: 'pointer',
      border: '2px solid #111',
      background: active ? '#D9D7CF' : 'var(--paper)',
      color: '#111',
      boxShadow: active ? '1px 1px 0 0 #111' : '3px 3px 0 0 #111',
      transform: active ? 'translate(2px, 2px)' : 'translate(0, 0)',
      fontFamily: gbStyles.font, fontSize: 11, fontWeight: 700,
      transition: 'transform 60ms, box-shadow 60ms',
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: 'var(--ink-2)', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function PixelInput({ placeholder }) {
  return (
    <input placeholder={placeholder} style={{
      width: '100%', padding: '6px 8px', border: '2px solid #111',
      background: 'var(--paper)', boxSizing: 'border-box',
      fontFamily: gbStyles.font, fontSize: 11, outline: 'none',
    }}/>
  );
}

function PixelMiniBtn({ children }) {
  return (
    <button style={{
      padding: '3px 8px', border: '2px solid #111', background: 'var(--paper)',
      cursor: 'pointer', fontFamily: gbStyles.font, fontSize: 10,
    }}>{children}</button>
  );
}

function CategoryCard({ active, onClick, icon, title, en, sub }) {
  // Off = white, on = light gray. Keep 3D shadow press feel.
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: 10, cursor: 'pointer', textAlign: 'left',
      border: '2px solid #111',
      background: active ? '#D9D7CF' : 'var(--paper)',
      color: '#111',
      boxShadow: active ? '1px 1px 0 0 #111' : '3px 3px 0 0 #111',
      transform: active ? 'translate(2px, 2px)' : 'translate(0, 0)',
      fontFamily: gbStyles.font, transition: 'transform 60ms, box-shadow 60ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Sprite kind={icon} size={18}/>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 9, opacity: 0.6, fontFamily: gbStyles.fontEn, letterSpacing: 2 }}>{en}</span>
      </div>
      <div style={{ fontSize: 10, opacity: 0.8 }}>{sub}</div>
    </button>
  );
}

Object.assign(window, { PostGB, CommunityGB });
