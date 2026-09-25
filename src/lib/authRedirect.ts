// Accept only routes within this app; shared links survive the OAuth round trip.
export function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  if (/^\/(login|auth-wall|onboarding)(?:[/?#]|$)/.test(value)) return '/'
  return value
}

export function rememberRedirect(value: string) {
  sessionStorage.setItem('loginRedirect', safeRedirect(value))
}

export function pendingRedirect() {
  return safeRedirect(sessionStorage.getItem('loginRedirect'))
}
