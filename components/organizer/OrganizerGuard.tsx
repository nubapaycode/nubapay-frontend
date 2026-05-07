'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/Spinner'
import { authPaths } from '@/lib/api'
import { authHeadersJson, clearAuthSession, getAuthToken, setAuthSession, type AuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'

export function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ok'>('loading')

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.replace('/login')
      return
    }

    ;(async () => {
      try {
        const res = await browserFetch(authPaths.me(), { headers: authHeadersJson() })
        if (!res.ok) {
          clearAuthSession()
          router.replace('/login')
          return
        }
        const body = (await res.json()) as {
          user?: AuthUser
          staff_memberships?: AuthUser['staff_memberships']
        }
        if (body.user) {
          setAuthSession(token, {
            ...body.user,
            staff_memberships: body.staff_memberships ?? body.user.staff_memberships,
          })
        }
        setState('ok')
      } catch {
        setState('ok')
      }
    })()
  }, [router])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }

  return <>{children}</>
}
