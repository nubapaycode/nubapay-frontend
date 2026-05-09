import { headers } from 'next/headers'

/** Headers para que Flask resuelva tenant cuando el frontend llama a un API externo (`NEXT_PUBLIC_API_URL`). */
export async function brandedRequestHeaders(): Promise<Record<string, string>> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').trim()
  const out: Record<string, string> = {}
  if (host) {
    out['X-Branded-Host'] = host
  }
  return out
}
