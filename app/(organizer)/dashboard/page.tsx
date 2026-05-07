'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/Spinner'
import { eventsPaths } from '@/lib/api'
import { authHeadersJson, getAuthToken, getAuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { firstAllowedWorkspaceSegment, workspaceToolsForEvent } from '@/lib/organizerStaffTools'
import type { OrganizerEventRow } from '@/lib/types/organizer'

/**
 * Punto de entrada "Ver dashboard" desde el sitio público.
 * Redirige al panel de métricas del primer evento disponible (misma lógica que post-login).
 */
export default function OrganizerDashboardEntryPage() {
  const router = useRouter()

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/login')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await browserFetch(eventsPaths.list({ page: 1, page_size: 1 }), {
          headers: authHeadersJson(),
        })
        const body = (await res.json()) as { events?: OrganizerEventRow[] }
        const first = body.events?.[0]
        if (!cancelled && first?.id) {
          const membership = first.membership === 'staff' ? 'staff' : 'owner'
          const tools = workspaceToolsForEvent(membership, first.id, getAuthUser()?.staff_memberships)
          const segment = firstAllowedWorkspaceSegment(tools)
          router.replace(`/events/${first.id}/${segment}`)
          return
        }
      } catch {
        /* misma reserva que login */
      }
      if (!cancelled) router.replace('/events')
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gray-100">
      <Spinner size="lg" className="text-gray-900" />
    </div>
  )
}
