export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
}

const TOKEN_KEY = 'nubapay_token'
const USER_KEY = 'nubapay_user'

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function authHeadersJson(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = getAuthToken()
  if (t) headers.Authorization = `Bearer ${t}`
  return headers
}
