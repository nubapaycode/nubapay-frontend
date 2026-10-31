'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/Spinner'
import { authPaths } from '@/lib/api'
import {
  authHeadersJson,
  clearAuthSession,
  getAuthToken,
  isSessionRejected,
  setAuthSession,
  type AuthUser,
} from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading')

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    ;(async () => {
      try {
        const res = await browserFetch(authPaths.me(), { headers: authHeadersJson() })
        if (isSessionRejected(res)) {
          clearAuthSession()
          router.replace(`/login?next=${encodeURIComponent(pathname)}&expired=1`)
          return
        }
        if (!res.ok) {
          // 5xx / 429: el servidor falló, no la sesión. Se ofrece reintentar sin perder el login.
          setState('error')
          return
        }
        const body = (await res.json()) as { user?: AuthUser; token?: string }
        if (!body.user?.is_platform_admin) {
          setState('denied')
          return
        }
        setAuthSession(body.token ?? token, body.user)
        setState('ok')
      } catch {
        setState('error')
      }
    })()
  }, [router, pathname, attempt])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-canvas">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-admin-canvas px-4 text-center">
        <p className="text-white/80">No se pudo verificar tu sesión. Tu login sigue guardado.</p>
        <button
          type="button"
          onClick={() => {
            setState('loading')
            setAttempt((n) => n + 1)
          }}
          className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-admin-canvas px-4 text-center">
        <p className="text-white/80">Esta cuenta no tiene acceso al panel de administración.</p>
        <button
          type="button"
          onClick={() => router.replace('/events')}
          className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Ir al panel de organizador
        </button>
      </div>
    )
  }

  return <>{children}</>
}
