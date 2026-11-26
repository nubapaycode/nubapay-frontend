'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/Spinner'
import { authPaths } from '@/lib/api'
import {
  type AuthUser,
  authHeadersJson,
  getAuthToken,
  getAuthUser,
  setAuthSession,
} from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { isParkingOwner } from '@/lib/modules'

/**
 * Deja pasar solo a cuentas con el módulo `parking_owner`.
 *
 * `OrganizerGuard` (el layout padre) ya valida el token, pero no los permisos, y el usuario guardado en
 * localStorage puede estar desactualizado (p. ej. el admin acaba de darle el permiso). Por eso se
 * confirma contra `/auth/me` antes de decidir; si el servidor falla, se usa lo guardado.
 */
export function ParkingOwnerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.replace('/ingresar')
      return
    }

    let cancelled = false
    ;(async () => {
      let user: AuthUser | null = getAuthUser()
      try {
        const res = await browserFetch(authPaths.me(), { headers: authHeadersJson() })
        if (res.ok) {
          const body = (await res.json()) as {
            user?: AuthUser
            token?: string
            staff_memberships?: AuthUser['staff_memberships']
          }
          if (body.user) {
            user = { ...body.user, staff_memberships: body.staff_memberships ?? body.user.staff_memberships }
            setAuthSession(body.token ?? token, user)
          }
        }
      } catch {
        /* falla transitoria: se decide con el usuario guardado */
      }
      if (cancelled) return
      if (isParkingOwner(user)) setAllowed(true)
      else router.replace('/panel')
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }
  return <>{children}</>
}
