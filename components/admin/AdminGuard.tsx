'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/Spinner'
import { authPaths } from '@/lib/api'
import {
  authHeadersJson,
  clearAuthSession,
  getAuthToken,
  setAuthSession,
  type AuthUser,
} from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    ;(async () => {
      try {
        const res = await browserFetch(authPaths.me(), { headers: authHeadersJson() })
        if (!res.ok) {
          clearAuthSession()
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
          return
        }
        const body = (await res.json()) as { user?: AuthUser }
        if (!body.user?.is_platform_admin) {
          setState('denied')
          return
        }
        setAuthSession(token, body.user)
        setState('ok')
      } catch {
        clearAuthSession()
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      }
    })()
  }, [router, pathname])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0F] px-4 text-center">
        <p className="text-white/80">Esta cuenta no tiene acceso al panel de administración.</p>
        <button
          type="button"
          onClick={() => router.replace('/events')}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Ir al panel de organizador
        </button>
      </div>
    )
  }

  return <>{children}</>
}
