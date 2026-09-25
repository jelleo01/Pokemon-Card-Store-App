const shown = new Set<string>()
export function announcePoints(amount: number, label = '', receipt?: string) {
  if (!amount || (receipt && shown.has(receipt))) return
  if (receipt) shown.add(receipt)
  window.dispatchEvent(new CustomEvent('points-notice', { detail: { amount, label } }))
}
