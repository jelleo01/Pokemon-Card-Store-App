import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/ui/BackButton'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import PointsBadge from '@/components/ui/PointsBadge'
import { gbStyles } from '@/lib/gbStyles'

export default function PointsPage() {
  const navigate = useNavigate()
  return <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font }}>
    <header style={{ padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '2px solid #111' }}>
      <BackButton onClick={() => navigate(-1)} /><b style={{ flex: 1 }}>포인트 안내</b><PointsBadge />
    </header>
    <main style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PixelBorder padding={18}>
        <h2 style={{ fontWeight: 700, marginBottom: 16 }}>포인트 모으기</h2>
        <ul style={{ lineHeight: 2.1, paddingLeft: 18, listStyle: 'disc' }}>
          <li>처음 가입하면 <b>+20 P</b></li>
          <li>가게의 카드 소식 작성 <b>+3 P</b><br /><small>카드 있음·없음 모두 포함해요.</small></li>
          <li>질문 작성 <b>+1 P</b></li>
          <li>댓글·답변 작성 <b>+1 P</b><br /><small>내 글에서 이어가는 대화도 포함해요.</small></li>
          <li>다른 사람의 글에 첫 좋아요 <b>+1 P</b></li>
          <li>홈에서 앱 사용 후기 최초 제출 <b>+15 P</b><br /><small>별점과 관계없이 계정당 한 번 지급해요.</small></li>
        </ul>
        <p style={{ fontSize: 12, marginTop: 14, lineHeight: 1.8 }}>내 글에 누르는 좋아요는 적립되지 않아요. 좋아요를 취소했다 다시 눌러도 중복 적립되지 않아요.</p>
      </PixelBorder>
      <PixelBorder padding={18}>
        <h2 style={{ fontWeight: 700, marginBottom: 16 }}>장소 정보 열람</h2>
        <p style={{ lineHeight: 1.9 }}>가게 한 곳에 <b>5 P</b>를 사용하면 <b>1주일(7일)</b> 동안 자유롭게 열람할 수 있어요. 기간 내 재방문과 새로고침은 무료예요.</p>
        <p style={{ fontSize: 12, marginTop: 14 }}>소식 수를 먼저 확인해 주세요. 7일이 지난 뒤 다시 열면 5 P가 사용돼요.</p>
      </PixelBorder>
      <PixelButton full onClick={() => navigate('/points/history')}>포인트 기록 보기 ▶</PixelButton>
    </main>
  </div>
}
