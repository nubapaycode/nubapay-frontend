import { headers } from 'next/headers'

const verbose = () =>
  process.env.DEBUG_TENANT_THEME === '1' || process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME === '1'

/** Logs en terminal de Next (solo con DEBUG_TENANT_THEME o NEXT_PUBLIC_DEBUG_TENANT_THEME = 1). */
export async function logOrganizerSsrContext(
  scope: string,
  extra?: Record<string, string | undefined>,
): Promise<void> {
  if (!verbose()) return
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').trim()
  console.warn(`[nubapay:ssr organizer] ${scope}`, {
    host: host || '(sin host)',
    hint: 'Tema marca por host: variables en OrganizerThemeBridge; logo en sidebar si hay marca.',
    ...extra,
  })
}
