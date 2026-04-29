// Game Boy / pixel-style version of Pokemon Cards
// Two screens: HomeGB, MapGB. Pixel borders, dot shadows, dithered fills.

const gbStyles = {
  font: "'Galmuri11', 'Geist', ui-monospace, monospace",
  fontEn: "'Geist', 'Galmuri11', ui-monospace, monospace",
};

// ─── Pixel primitives ─────────────────────────────────────
function PixelBorder({ children, style, color = '#111', bg = '#FAFAF7', padding = 12, onClick }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', background: bg, padding,
      boxShadow: `inset 0 0 0 2px ${color}, 0 2px 0 0 ${color}`,
      clipPath: `polygon(
        2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
        100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
        2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px),
        0 2px, 2px 2px
      )`,
      ...style,
    }}>{children}</div>
  );
}

function PixelButton({ children, color = '#111', bg = '#FAFAF7', fg, full, onClick, style, sm }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: gbStyles.font, fontSize: sm ? 11 : 13,
      color: fg || color, background: bg, border: `2px solid ${color}`,
      padding: sm ? '5px 10px' : '8px 14px',
      width: full ? '100%' : undefined, cursor: 'pointer',
      boxShadow: `3px 3px 0 0 ${color}`,
      transition: 'transform 60ms, box-shadow 60ms',
      imageRendering: 'pixelated',
      ...style,
    }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `1px 1px 0 0 ${color}`; }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = 'translate(0,0)';     e.currentTarget.style.boxShadow = `3px 3px 0 0 ${color}`; }}
      onMouseLeave={(e)=> { e.currentTarget.style.transform = 'translate(0,0)';     e.currentTarget.style.boxShadow = `3px 3px 0 0 ${color}`; }}
    >{children}</button>
  );
}

const dither = {
  background: `repeating-linear-gradient(45deg, rgba(17,17,17,0.10) 0 2px, transparent 2px 4px), var(--paper)`,
};

// ─── Sprite system ────────────────────────────────────────
// Pixel-art icons: pokeball, card, map (folded paper map), megaphone (community).
function Sprite({ kind = 'ball', size = 22, dark = false }) {
  const fg = dark ? '#FAFAF7' : '#111';
  const accent = '#E63946';
  const paper = dark ? '#111' : '#FAFAF7';

  if (kind === 'ball') {
    // Pokeball-like capsule (original geometry; red top / white bottom / centered band)
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="3" y="1" width="8" height="1" fill={fg}/>
        <rect x="2" y="2" width="10" height="1" fill={fg}/>
        <rect x="2" y="3" width="10" height="3" fill={accent}/>
        <rect x="1" y="3" width="1" height="3" fill={fg}/>
        <rect x="12" y="3" width="1" height="3" fill={fg}/>
        <rect x="1" y="6" width="12" height="1" fill={fg}/>
        <rect x="2" y="7" width="10" height="3" fill={paper}/>
        <rect x="1" y="7" width="1" height="3" fill={fg}/>
        <rect x="12" y="7" width="1" height="3" fill={fg}/>
        <rect x="2" y="10" width="10" height="1" fill={fg}/>
        <rect x="3" y="11" width="8" height="1" fill={fg}/>
        <rect x="6" y="6" width="2" height="1" fill={fg}/>
      </svg>
    );
  }
  if (kind === 'card') {
    // Trading card (rectangle with header band + "stat lines")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="3" y="1" width="8" height="12" fill={paper} stroke={fg} strokeWidth="1"/>
        <rect x="4" y="2" width="6" height="3" fill={accent}/>
        <rect x="4" y="6" width="6" height="1" fill={fg}/>
        <rect x="4" y="8" width="4" height="1" fill={fg}/>
        <rect x="4" y="10" width="5" height="1" fill={fg}/>
      </svg>
    );
  }
  if (kind === 'map') {
    // Folded paper map: zig-zag fold lines + a small marker pin
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        {/* paper */}
        <rect x="1" y="2" width="12" height="10" fill={paper} stroke={fg} strokeWidth="1"/>
        {/* fold lines (vertical) */}
        <rect x="5" y="2" width="1" height="10" fill={fg}/>
        <rect x="9" y="2" width="1" height="10" fill={fg}/>
        {/* zig-zag offset on middle panels */}
        <rect x="6" y="2" width="3" height="1" fill={fg}/>
        <rect x="6" y="11" width="3" height="1" fill={fg}/>
        {/* marker pin */}
        <rect x="3" y="5" width="2" height="2" fill={accent}/>
        <rect x="3" y="7" width="1" height="1" fill={fg}/>
      </svg>
    );
  }
  if (kind === 'mega') {
    // Megaphone (community / 소식 announcer)
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        {/* horn */}
        <rect x="9" y="4" width="1" height="6" fill={fg}/>
        <rect x="7" y="3" width="2" height="8" fill={fg}/>
        <rect x="8" y="4" width="1" height="6" fill={accent}/>
        {/* body */}
        <rect x="2" y="5" width="5" height="4" fill={accent}/>
        <rect x="1" y="5" width="1" height="4" fill={fg}/>
        <rect x="2" y="4" width="5" height="1" fill={fg}/>
        <rect x="2" y="9" width="5" height="1" fill={fg}/>
        {/* sound waves */}
        <rect x="11" y="3" width="1" height="1" fill={fg}/>
        <rect x="12" y="5" width="1" height="1" fill={fg}/>
        <rect x="11" y="6" width="1" height="2" fill={fg}/>
        <rect x="12" y="8" width="1" height="1" fill={fg}/>
        <rect x="11" y="10" width="1" height="1" fill={fg}/>
      </svg>
    );
  }
  if (kind === 'person') {
    // Simple pixel person: head + shoulders silhouette
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        {/* head */}
        <rect x="5" y="2" width="4" height="4" fill={fg}/>
        <rect x="6" y="3" width="2" height="2" fill={paper}/>
        {/* shoulders / body */}
        <rect x="3" y="7" width="8" height="5" fill={fg}/>
        <rect x="4" y="8" width="6" height="3" fill={paper}/>
        <rect x="2" y="11" width="10" height="1" fill={fg}/>
      </svg>
    );
  }
  if (kind === 'shop') {
    // Storefront (kept for HOME notice / list rows)
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="1" y="3" width="12" height="9" fill={paper} stroke={fg} strokeWidth="1"/>
        <rect x="1" y="2" width="12" height="2" fill={accent}/>
        <rect x="3" y="6" width="2" height="3" fill={fg}/>
        <rect x="9" y="6" width="2" height="3" fill={fg}/>
        <rect x="6" y="8" width="2" height="4" fill={fg}/>
      </svg>
    );
  }
  return null;
}

// Type → tiny pin sprite for map (visual legend match)
function TypePin({ type, size = 14, active }) {
  // Distinct silhouettes per type so they're scannable on the map.
  // 공식: filled square (most "official"); 자판기: stacked rect; 편의점: rounded;
  // 카드샵: card-shape mini.
  const fg = active ? '#FAFAF7' : '#111';
  const bg = active ? '#111' : '#FAFAF7';
  const accent = '#E63946';
  if (type === '공식') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="0" y="0" width="10" height="10" fill={fg}/>
        <rect x="1" y="1" width="8" height="8" fill={accent}/>
        <rect x="3" y="3" width="4" height="4" fill={bg}/>
      </svg>
    );
  }
  if (type === '자판기') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="1" y="0" width="8" height="10" fill={fg}/>
        <rect x="2" y="1" width="6" height="3" fill={accent}/>
        <rect x="2" y="5" width="6" height="1" fill={bg}/>
        <rect x="2" y="7" width="6" height="1" fill={bg}/>
      </svg>
    );
  }
  if (type === '편의점') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="0" y="2" width="10" height="6" fill={fg}/>
        <rect x="1" y="3" width="8" height="4" fill={bg}/>
        <rect x="0" y="1" width="10" height="1" fill={accent}/>
      </svg>
    );
  }
  // 카드샵
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
      <rect x="2" y="0" width="6" height="10" fill={fg}/>
      <rect x="3" y="1" width="4" height="3" fill={accent}/>
      <rect x="3" y="5" width="4" height="1" fill={bg}/>
      <rect x="3" y="7" width="3" height="1" fill={bg}/>
    </svg>
  );
}

// ─── Tab bar ──────────────────────────────────────────────
// HOME = pokeball, MAP = folded map, COMMUNITY = megaphone (3 distinct shapes)
function GBTabBar({ active, onTab }) {
  const items = [
    { id: 'home',      label: 'HOME',      kind: 'ball' },
    { id: 'map',       label: 'MAP',       kind: 'map'  },
    { id: 'community', label: 'COMMUNITY', kind: 'mega' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 0, padding: '8px 10px 14px',
      borderTop: '2px solid #111', background: 'var(--paper)', flexShrink: 0,
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onTab && onTab(it.id)}
          style={{
            flex: 1, background: active === it.id ? '#111' : 'transparent',
            color: active === it.id ? '#FAFAF7' : '#111',
            border: 'none', padding: '6px 0', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            fontFamily: gbStyles.font, fontSize: 9, letterSpacing: 0.5,
          }}>
          <Sprite kind={it.kind} size={22} dark={active === it.id}/>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── HOME (game boy) ──────────────────────────────────────
// All content vertically centered so there's no awkward bottom void.
function HomeGB({ onNav, user, location }) {
  const [tab, setTab] = React.useState('home');
  const loc = location || '강남구 역삼동';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>

      <div style={{ padding: '14px 16px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sprite kind="ball" size={22}/>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>POKEMON CARDS</div>
          <div style={{ flex: 1 }}/>
          <button onClick={() => onNav && onNav(user ? 'profile' : 'login')} title={user ? '프로필' : '로그인'} style={{
            width: 30, height: 30, padding: 0, cursor: 'pointer',
            background: 'var(--paper)',
            border: '2px solid #111', boxShadow: '2px 2px 0 0 #111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sprite kind="person" size={18}/>
          </button>
        </div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, letterSpacing: 1 }}>
          ※ {user ? `${user.id} · 카드 판매점 찾기` : '카드 판매점 찾기 · 로그인 시 커뮤니티 가능'}
        </div>
      </div>

      {/* Body — flex with vertically centered content (justifyContent: center) */}
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', justifyContent: 'center' }}>

        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          <div style={{ background: '#111', color: 'var(--paper)', padding: '4px 8px', fontSize: 10, letterSpacing: 2 }}>NOTICE</div>
          <div style={{ padding: '10px 12px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>★ 신상 카드팩 입고!</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              강남 일대 6개 매장에 4월 28일자 신상 박스가 들어왔어요. 지도에서 ★ 표시를 확인해보세요.
            </div>
          </div>
        </PixelBorder>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={() => onNav && onNav('map')}>
            <span style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
              <Sprite kind="map" size={18} dark/> <span>지도 찾기 / FIND ON MAP</span>
            </span>
          </PixelButton>
          <PixelButton full color="#111" bg="var(--paper)">
            <span style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
              <Sprite kind="card" size={18}/> <span>글 쓰기 / POST</span>
            </span>
          </PixelButton>
          <PixelButton full color="#111" bg="var(--paper)">
            <span style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
              <Sprite kind="mega" size={18}/> <span>커뮤니티 / COMMUNITY</span>
            </span>
          </PixelButton>
        </div>

        <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
          <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>위치선택 / LOCATION</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>▶ {loc}</div>
            <PixelButton sm color="#111" bg="var(--paper)" onClick={() => onNav && onNav('location')}>CHANGE</PixelButton>
          </div>
          <div style={{ marginTop: 6 }}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <button onClick={() => onNav && onNav('location')} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: gbStyles.font, fontSize: 11, color: 'var(--ink-2)',
              }}>
                <span style={{ fontSize: 11 }}>Q</span>
                <span style={{ flex: 1 }}>다른 동네 검색하기...</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
              </button>
            </PixelBorder>
          </div>
        </PixelBorder>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: '근처', v: '6' },
            { k: '재고', v: '4' },
            { k: '소식', v: '11' },
          ].map(s => (
            <PixelBorder key={s.k} color="#111" bg="var(--paper)" padding={8} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--ink-2)' }}>{s.k}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: gbStyles.fontEn }}>{s.v}</div>
            </PixelBorder>
          ))}
        </div>

      </div>

      <GBTabBar active={tab} onTab={(t) => {
        setTab(t);
        if (t === 'map') onNav && onNav('map');
        if (t === 'community') onNav && onNav('community');
      }}/>
    </div>
  );
}

// ─── MAP control buttons (Kakao-style: locate me + zoom) ──
function MapControl({ children, onClick, top, bottom, right }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', right, top, bottom,
      width: 30, height: 30, padding: 0,
      background: 'var(--paper)', border: '2px solid #111',
      cursor: 'pointer', boxShadow: '2px 2px 0 0 #111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: gbStyles.font, fontSize: 14, fontWeight: 700,
    }}>{children}</button>
  );
}

// ─── MAP (game boy) — full feedback applied ──────────────
function MapGB({ onNav }) {
  const [openId, setOpenId]   = React.useState(null);
  const [tab, setTab]         = React.useState('map');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [indexOpen, setIndexOpen]   = React.useState(false);
  const [active, setActive]   = React.useState(window.SHOP_TYPES);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery]     = React.useState('');
  const [me, setMe]           = React.useState({ x: 50, y: 50 });
  const [zoom, setZoom]       = React.useState(1);

  const open = window.SHOPS.find(s => s.id === openId);

  const visible = window.SHOPS.filter(s => active.includes(s.type));
  // Sort: 거리순 (default and only sort per feedback)
  const sorted = [...visible].sort((a, b) => a.dist - b.dist);

  const toggleType = (t) => setActive(a => a.includes(t) ? a.filter(x => x !== t) : [...a, t]);

  const searchResults = query
    ? window.SHOPS.filter(s => s.name.includes(query) || s.addr.includes(query) || s.type.includes(query))
    : window.SHOPS.slice(0, 4);

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onNav && onNav('home')} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, fontFamily: gbStyles.fontEn }}>MAP</div>
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 10, letterSpacing: 1 }}>강남 · 거리순</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <button onClick={() => setSearchOpen(true)} style={{
            flex: 1, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
          }}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                <span style={{ flex: 1, fontFamily: gbStyles.fontEn, fontSize: 11, color: 'var(--ink-2)' }}>매장 / 주소 / 종류 찾기...</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
              </div>
            </PixelBorder>
          </button>
        </div>
      </div>

      {/* Map view (kakao-style controls + index legend) */}
      <div style={{
        position: 'relative', height: 220, borderBottom: '2px solid #111', overflow: 'hidden',
        background: '#EEECE2', flexShrink: 0, ...dither,
      }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position:'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%', transition: 'transform 120ms' }}>
          <defs>
            <pattern id="streets" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 5 H10 M5 0 V10" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#streets)"/>
          <rect x="0" y="46" width="100" height="6" fill="rgba(230,57,70,0.18)"/>
          <rect x="44" y="0" width="6" height="100" fill="rgba(230,57,70,0.18)"/>
        </svg>

        {/* "내 위치" pin */}
        <div style={{ position: 'absolute', left: `${me.x}%`, top: `${me.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
          <div style={{ width: 14, height: 14, background: '#1E88FF', border: '2px solid #111', boxShadow: '0 0 0 4px rgba(30,136,255,0.25)' }}/>
          <div style={{ marginTop: 2, fontSize: 9, fontWeight: 700, padding: '1px 4px', background: '#FAFAF7', border: '2px solid #111', whiteSpace: 'nowrap' }}>내 위치</div>
        </div>

        {/* shop pins */}
        {sorted.map(s => (
          <button key={s.id} onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            transform: 'translate(-50%, -100%)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <div style={{
              padding: '2px 4px',
              background: openId === s.id ? '#111' : 'var(--paper)',
              color: openId === s.id ? '#FAFAF7' : '#111',
              border: '2px solid #111',
              fontFamily: gbStyles.font, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
              boxShadow: '2px 2px 0 0 #111',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <TypePin type={s.type} size={10} active={openId === s.id}/>
              <span>{s.name.split(' ')[0]}</span>
            </div>
          </button>
        ))}

        {/* picking-mode hint removed; search modal handles discovery */}

        {/* INDEX (legend) */}
        <div style={{ position: 'absolute', top: 8, right: 8, maxWidth: 150 }}>
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <button onClick={() => setIndexOpen(o => !o)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', fontSize: 10, letterSpacing: 2, fontFamily: gbStyles.fontEn,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}>
              INDEX <span style={{ marginLeft: 'auto' }}>{indexOpen ? '▲' : '▼'}</span>
            </button>
            {indexOpen && (
              <div style={{ borderTop: '2px solid #111', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {window.SHOP_TYPES.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                    <TypePin type={t} size={12}/>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </PixelBorder>
        </div>

        {/* Map controls (kakao map style) */}
        <MapControl right={8} top={8 + (indexOpen ? 110 : 28)} onClick={() => { setMe({ x: 50, y: 50 }); setZoom(1); }}>
          <Sprite kind="ball" size={16}/>
        </MapControl>
        <MapControl right={8} top={8 + (indexOpen ? 110 : 28) + 36} onClick={() => setZoom(z => Math.min(2, z + 0.2))}>+</MapControl>
        <MapControl right={8} top={8 + (indexOpen ? 110 : 28) + 36 + 32} onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}>−</MapControl>
      </div>

      {/* Filter row (toggle-down) */}
      <div style={{ borderBottom: '2px solid #111', background: 'var(--paper-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <button onClick={() => setFilterOpen(o => !o)} style={{
            background: filterOpen ? '#111' : 'var(--paper)', color: filterOpen ? '#FAFAF7' : '#111',
            border: '2px solid #111', padding: '4px 10px', cursor: 'pointer',
            fontFamily: gbStyles.font, fontSize: 10, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            FILTER <span>{filterOpen ? '▲' : '▼'}</span>
          </button>
          <div style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: 1 }}>
            ▶ 거리순 · {active.length}/{window.SHOP_TYPES.length} 종류 표시
          </div>
        </div>
        {filterOpen && (
          <div style={{ padding: '4px 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {window.SHOP_TYPES.map(t => {
              const on = active.includes(t);
              return (
                <button key={t} onClick={() => toggleType(t)} style={{
                  fontSize: 10, padding: '4px 8px', border: '2px solid #111',
                  background: on ? '#111' : 'var(--paper)', color: on ? '#FAFAF7' : '#111',
                  letterSpacing: 1, cursor: 'pointer', fontFamily: gbStyles.font,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <TypePin type={t} size={10} active={on}/>
                  <span>{t}</span>
                  <span style={{ opacity: 0.6 }}>{on ? '☑' : '☐'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Shop list — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        {sorted.map(s => {
          const isOpen = openId === s.id;
          return (
            <div key={s.id}>
              <button onClick={() => setOpenId(isOpen ? null : s.id)} style={{
                width: '100%', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer',
              }}>
                <PixelBorder color="#111" bg={isOpen ? '#111' : 'var(--paper)'} padding={0}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', color: isOpen ? '#FAFAF7' : '#111' }}>
                    <TypePin type={s.type} size={16} active={isOpen}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, fontFamily: gbStyles.fontEn }}>
                        {s.dist}km · {s.type} · stock:{s.stockLevel}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 8px',
                      background: 'var(--red)', color: '#FAFAF7',
                      border: '2px solid ' + (isOpen ? '#FAFAF7' : '#111'),
                      fontFamily: gbStyles.fontEn, letterSpacing: 1,
                    }}>GO ▶</div>
                  </div>
                </PixelBorder>
              </button>

              {isOpen && open && (
                <div style={{ marginTop: -2 }}>
                  <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
                    <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 6, fontFamily: gbStyles.fontEn }}>▼ DETAIL</div>
                    <Row k="위치"   v={open.addr}/>
                    <Row k="거리"   v={`${open.dist}km`}/>
                    <Row k="분류"   v={open.type}/>
                    <Row k="UPDATE" v={open.update}/>
                    <Row k="재고"   v={open.stock}/>
                    <Row k="소식"   v={`${open.newsCount}건`}/>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <PixelButton sm full color="#111" bg="var(--paper)">✎ 수정 제안</PixelButton>
                      <PixelButton sm full color="#111" bg="var(--red)" fg="#FAFAF7">더 자세히 ▶</PixelButton>
                    </div>
                  </PixelBorder>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>
            ☐ 모든 분류가 꺼져있어요. FILTER에서 켜주세요.
          </div>
        )}
      </div>

      <GBTabBar active={tab} onTab={(t) => {
        setTab(t);
        if (t === 'home') onNav && onNav('home');
        if (t === 'community') onNav && onNav('community');
      }}/>

      {/* SEARCH overlay */}
      {searchOpen && (
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--paper)', zIndex: 50,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '2px solid #111', background: 'var(--paper-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { setSearchOpen(false); setQuery(''); }} style={{ background: 'transparent', border: '2px solid #111', width: 26, height: 22, fontFamily: gbStyles.font, cursor: 'pointer', fontSize: 12 }}>✕</button>
              <PixelBorder color="#111" bg="var(--paper)" padding={0} style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="매장 / 주소 / 종류 검색" style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: gbStyles.font, fontSize: 12,
                  }}/>
                  {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>✕</button>}
                </div>
              </PixelBorder>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-2)', marginBottom: 8, fontFamily: gbStyles.fontEn }}>
              {query ? `RESULTS · ${searchResults.length}` : 'NEARBY'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {searchResults.map(s => (
                <button key={s.id} onClick={() => { setOpenId(s.id); setSearchOpen(false); setQuery(''); }} style={{
                  textAlign: 'left', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                }}>
                  <PixelBorder color="#111" bg="var(--paper)" padding={0}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
                      <TypePin type={s.type} size={14}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, fontFamily: gbStyles.fontEn }}>{s.addr} · {s.dist}km</div>
                      </div>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                    </div>
                  </PixelBorder>
                </button>
              ))}
              {searchResults.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-2)' }}>
                  검색 결과가 없어요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:8, fontSize: 11, padding: '3px 0', borderBottom: '1px dashed rgba(0,0,0,0.2)' }}>
      <div style={{ width: 56, color: 'var(--ink-2)', letterSpacing: 1, fontSize: 10, flexShrink: 0 }}>{k}</div>
      <div style={{ flex: 1, fontWeight: 700, fontFamily: 'Geist, Galmuri11, monospace', wordBreak: 'keep-all' }}>{v}</div>
    </div>
  );
}

Object.assign(window, { HomeGB, MapGB });
