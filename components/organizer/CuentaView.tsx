'use client'

import { useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { getAuthUser } from '@/lib/authSession'

export function CuentaView() {
  const [email, setEmail] = useState('')

  useEffect(() => { setEmail(getAuthUser()?.email ?? '') }, [])

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <OrganizerToolHeading
        title="Cuenta"
        description="Tu sesión activa."
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
    </div>
  )
}
