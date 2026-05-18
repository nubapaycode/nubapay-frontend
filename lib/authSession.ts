export type OrganizerStaffTools = {
  dashboard: boolean
  storefront: boolean
  products: boolean
  scanner: boolean
  orders: boolean
  pickup_points: boolean
  payments: boolean
}

export type StaffMembership = {
  event_id: string
  role: string
  tools: OrganizerStaffTools
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  partner?: boolean
  tenant_id?: string
  /** Subdominio del tenant (`platform` para la instancia compartida). */
  tenant_subdomain?: string
  /** True si el usuario sigue en el tenant plataforma (puede crear espacio dedicado desde Marca). */
  on_platform_tenant?: boolean
  tenant_partner_whitelabel_enabled?: boolean
  staff_memberships?: StaffMembership[]
  onboarding_completed?: boolean
}
const TOKEN_KEY = 'nubapay_token'
const USER_KEY = 'nubapay_user'

function emitAuthChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('nubapay-auth-change'))
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  emitAuthChanged()
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  emitAuthChanged()
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
