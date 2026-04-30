'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { eventsPaths } from '@/lib/api'
import { authHeadersJson, clearAuthSession } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import type { OrganizerEventRow } from '@/lib/types/organizer'

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
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const loadEvent = useCallback(async () => {
    try {
      const res = await browserFetch(eventsPaths.detail(eventId), {
        headers: authHeadersJson(),
      })
      const body = (await res.json()) as { event?: OrganizerEventRow; error?: string }
      if (!res.ok) {
        setNotFound(true)
        return
      }
      if (body.event?.name) setEventTitle(body.event.name)
    } catch {
      setNotFound(true)
    }
  }, [eventId])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

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

  const base = `/events/${eventId}`

  return (
    <div className="flex min-h-screen bg-gray-100">
      <EventOrganizerSidebar
        eventTitle={eventTitle}
        basePath={base}
        pathname={pathname}
        onLogout={() => {
          clearAuthSession()
          router.replace('/')
        }}
      />
      <div className="flex-1 bg-white overflow-hidden md:rounded-tl-3xl md:rounded-bl-3xl">
        <div className="pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  )
}
