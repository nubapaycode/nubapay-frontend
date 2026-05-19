'use client'

import { CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { getAuthUser } from '@/lib/authSession'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

export function CuentaView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const { show: showToast, ToastPortal } = useToast()

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) setEvent(res.event)
    else showToast(res.error, 'error')
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])
  useEffect(() => { setEmail(getAuthUser()?.email ?? '') }, [])

  const mpHref = `/events/${eventId}/cuenta/mercadopago`

  if (loading) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <ToastPortal />

      <OrganizerToolHeading
        title="Cuenta"
        description="Tu sesión activa y método de cobro para este evento."
      />

      {/* ── Sesión ── */}
      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white uppercase">
              {email ? email[0] : '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Sesión activa</p>
            <p className="text-xs text-gray-400 mt-0.5">{email || '…'}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Para cambiar tu contraseña o datos de cuenta, contactá al administrador de la plataforma.
          </p>
        </div>
      </section>

      {/* ── Mercado Pago ── */}
      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Link
          href={mpHref}
          className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#009EE3]/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5S13.14 1.5 9 1.5z" fill="#009EE3" fillOpacity=".12" />
              <path d="M6 9.75l2 2 4-4.5" stroke="#009EE3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Mercado Pago</p>
            {event?.has_mp_token ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 size={11} className="text-green-500 shrink-0" aria-hidden />
                <p className="text-xs text-green-600">Cuenta conectada</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">Conectá tu cuenta para recibir pagos</p>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" aria-hidden />
        </Link>
      </section>
    </div>
  )
}
