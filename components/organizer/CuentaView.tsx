'use client'

import { ChevronRight, Palette } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { useWorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { getAuthUser } from '@/lib/authSession'

export function CuentaView() {
  const [email, setEmail] = useState('')
  const access = useWorkspaceAccess()
  /** Marca y dominios es de la cuenta partner: solo la ve el dueño (misma regla que el guard del shell). */
  const brandHref =
    access?.membership === 'owner' && access.partnerBrand ? `${access.basePath}/brand` : null

  useEffect(() => { setEmail(getAuthUser()?.email ?? '') }, [])

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <OrganizerToolHeading
        title="Cuenta"
        description="Tu sesión activa."
      />

      <div className="space-y-3">
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

        {/* ── Marca y dominios ── */}
        {brandHref && (
          <Link
            href={brandHref}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
              <Palette size={16} strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Marca y dominios</p>
              <p className="text-xs text-gray-400 mt-0.5">Logo, colores y dominio propio de tu organización.</p>
            </div>
            <ChevronRight
              size={16}
              className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-600"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </div>
  )
}
