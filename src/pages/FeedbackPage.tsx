import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/ui/BackButton'
import AppFeedback from '@/components/ui/AppFeedback'
import { gbStyles } from '@/lib/gbStyles'

export default function FeedbackPage() {
  const navigate = useNavigate()
  return <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font }}>
    <header style={{ padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '2px solid #111', flexShrink: 0 }}><BackButton onClick={() => navigate('/')} /><b>앱 사용 후기</b></header>
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}><AppFeedback /></main>
  </div>
}
