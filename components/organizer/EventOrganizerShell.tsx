'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { eventsPaths } from '@/lib/api'
import { authHeadersJson, clearAuthSession, getAuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { workspaceToolsForEvent, firstAllowedWorkspaceSegment } from '@/lib/organizerStaffTools'
import type { OrganizerStaffTools } from '@/lib/authSession'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

import { EventOrganizerSidebar } from './EventOrganizerSidebar'

export function EventOrganizerShell({
  eventId,
  children,
}: {
  eventId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [eventMeta, setEventMeta] = useState<{ title: string; membership: 'owner' | 'staff' } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authNonce, setAuthNonce] = useState(0)

  const [brandNavEligible, setBrandNavEligible] = useState(false)

  const loadEvent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await browserFetch(eventsPaths.detail(eventId), {
        headers: authHeadersJson(),
      })
      const body = (await res.json()) as { event?: OrganizerEventDetail; error?: string }
      if (!res.ok) {
        setNotFound(true)
        return
      }
      if (body.event?.name) {
        setEventMeta({
          title: body.event.name,
          membership: body.event.membership === 'staff' ? 'staff' : 'owner',
        })
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      void loadEvent()
    })
    return () => window.cancelAnimationFrame(id)
  }, [loadEvent])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onAuth = () => setAuthNonce(n => n + 1)
    window.addEventListener('nubapay-auth-change', onAuth)
    return () => window.removeEventListener('nubapay-auth-change', onAuth)
  }, [])

  useEffect(() => {
    const onEventUpdated = (e: Event) => {
      const name = (e as CustomEvent<{ name: string }>).detail?.name
      if (name) setEventMeta(prev => prev ? { ...prev, title: name } : prev)
    }
    window.addEventListener('nubapay-event-updated', onEventUpdated)
    return () => window.removeEventListener('nubapay-event-updated', onEventUpdated)
  }, [])

  useEffect(() => {
    const syncBrand = () =>
      queueMicrotask(() => {
        const u = getAuthUser()
        if (!u || u.role === 'ORGANIZER_STAFF') {
          setBrandNavEligible(false)
          return
        }
        setBrandNavEligible(Boolean(u.partner))
      })
    syncBrand()
    if (typeof window === 'undefined') return
    window.addEventListener('nubapay-auth-change', syncBrand)
    return () => window.removeEventListener('nubapay-auth-change', syncBrand)
  }, [])

  const tools = useMemo(() => {
    if (!eventMeta) {
      return workspaceToolsForEvent(undefined, eventId, getAuthUser()?.staff_memberships)
    }
    return workspaceToolsForEvent(eventMeta.membership, eventId, getAuthUser()?.staff_memberships)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- authNonce refleja `nubapay-auth-change` (staff memberships).
  }, [eventMeta, eventId, authNonce])

  /** Si el integrante abre una URL de herramienta que no le corresponde, mandarlo a la primera permitida. */
  useEffect(() => {
    if (loading || !eventMeta || notFound) return
    const base = `/events/${eventId}`
    if (!pathname.startsWith(`${base}/`)) return

    const toolsNow = workspaceToolsForEvent(
      eventMeta.membership,
      eventId,
      getAuthUser()?.staff_memberships,
    )
    const segment = pathname.slice(base.length + 1).split('/')[0] ?? 'all'
    if (segment === 'all') return

    if (segment === 'brand') {
      if (eventMeta.membership !== 'owner' || !brandNavEligible) {
        router.replace(`${base}/${firstAllowedWorkspaceSegment(toolsNow)}`)
      }
      return
    }

    const segmentTool: Partial<Record<string, keyof OrganizerStaffTools>> = {
      dashboard: 'dashboard',
      storefront: 'storefront',
      products: 'products',
      scanner: 'scanner',
      orders: 'orders',
      'pickup-points': 'pickup_points',
      payments: 'payments',
    }

    if (
      (segment === 'staff' || segment === 'config') &&
      eventMeta.membership === 'staff'
    ) {
      router.replace(`${base}/${firstAllowedWorkspaceSegment(toolsNow)}`)
      return
    }

    const required = segmentTool[segment]
    if (required && !toolsNow[required]) {
      router.replace(`${base}/${firstAllowedWorkspaceSegment(toolsNow)}`)
    }
  }, [
    loading,
    eventMeta,
    notFound,
    eventId,
    pathname,
    authNonce,
    router,
    brandNavEligible,
  ])

  useEffect(() => {
    if (!notFound) return
    router.replace('/events')
  }, [notFound, router])

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Redirigiendo…</p>
      </div>
    )
  }

  if (loading || !eventMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }

  const base = `/events/${eventId}`

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-row overflow-hidden bg-gray-100">
      <EventOrganizerSidebar
        eventTitle={eventMeta.title}
        basePath={base}
        pathname={pathname}
        workspaceMembership={eventMeta.membership}
        tools={tools}
        onLogout={() => {
          clearAuthSession()
          router.replace('/')
        }}
        showPartnerBrand={brandNavEligible}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-tl-3xl md:rounded-bl-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  )
}
