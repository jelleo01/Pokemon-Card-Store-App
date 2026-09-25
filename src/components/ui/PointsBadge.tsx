import { usePoints } from '@/hooks/usePoints'

export default function PointsBadge() {
  const { balance, error, retry } = usePoints()
  return <button type="button" onClick={() => void retry()} title="포인트 새로고침"
    style={{ border: '2px solid #111', background: 'var(--paper-2)', color: 'var(--ink)', padding: '5px 8px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
    {error ? '포인트 재시도 ↻' : balance === undefined ? '… P' : `${balance} P`}
  </button>
}
