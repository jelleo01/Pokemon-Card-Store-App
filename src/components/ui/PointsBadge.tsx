import { useNavigate } from 'react-router-dom'
import { usePoints } from '@/hooks/usePoints'

export default function PointsBadge({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { balance, error, retry } = usePoints()
  return <button type="button" onClick={() => error ? void retry() : navigate('/points')} title="포인트 안내"
    style={{ border: '2px solid #111', background: 'var(--paper-2)', color: 'var(--ink)', padding: compact ? '2px 5px' : '5px 8px', fontSize: compact ? 11 : undefined, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
    {error ? (compact ? '↻ P' : '포인트 재시도 ↻') : balance === undefined ? '… P' : `${balance} P`}
  </button>
}
