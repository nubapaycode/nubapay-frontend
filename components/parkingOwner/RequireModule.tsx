'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { getAuthUser } from '@/lib/authSession'
import { type ModuleKey, PARKING_OWNER_HOME, hasModule } from '@/lib/modules'

/** Muestra la sección solo si la cuenta tiene el módulo; si no (p. ej. entró por URL), vuelve a Eventos. */
export function RequireModule({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const router = useRouter()
  const allowed = hasModule(getAuthUser()?.modules ?? [], module)
  useEffect(() => {
    if (!allowed) router.replace(`${PARKING_OWNER_HOME}/eventos`)
  }, [allowed, router])
  return allowed ? <>{children}</> : null
}
