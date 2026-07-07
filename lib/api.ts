/** Base URL del API Flask (ej. http://127.0.0.1:5001). Si está vacío, se usa el proxy de Next (`/api/backend/*`). */
export function getApiOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '')
}

/** Ruta API relativa al prefijo `/api` del backend (ej. `/health` → `/api/health` en Flask). */
export function apiUrl(apiPath: string): string {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  const origin = getApiOrigin()
  if (origin) return `${origin}/api${path}`
  return `/api/backend${path}`
}

export type DatabaseHealth = {
  configured: boolean
  ok?: boolean
  error?: string
}

export type HealthResponse = {
  status: string
  service: string
  database?: DatabaseHealth
}

export type LoginResponse = {
  ok: boolean
  error?: string
}

export { authPaths, catalogPaths, eventsPaths, partnerTenantPaths, platformAdminPaths, publicPaths, systemPaths } from './api/paths'
