import { headers } from 'next/headers'

/** URL absoluta para `fetch` en Server Components cuando `apiUrl` devolvió ruta relativa (`/api/backend/...`). */
export async function resolveInternalFetchUrl(url: string): Promise<string> {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}${url}`
}
