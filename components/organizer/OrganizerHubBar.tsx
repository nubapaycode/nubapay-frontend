'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { clearAuthSession, getAuthUser } from '@/lib/authSession'

export function OrganizerHubBar({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const [emailLabel, setEmailLabel] = useState('')

  useEffect(() => {
    setEmailLabel(getAuthUser()?.email ?? '')
  }, [])

  const logout = () => {
    clearAuthSession()
    router.replace('/')
  }

  return (
    <div className="flex items-center justify-between gap-4 pb-6 mb-2 md:-mt-2">
      <div className="min-w-0">
        <span className="text-base font-medium text-gray-900 tracking-tight">nubapay</span>
        <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">organizer</span>
        {!compact && (
          <p className="text-xs text-gray-400 mt-1">Creá un evento y abrí su panel para cargar el catálogo y ver pedidos.</p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-1">
        <p className="text-xs text-gray-400 truncate max-w-[140px] md:max-w-[220px]" title={emailLabel}>
          {emailLabel || '…'}
        </p>
        <button
          type="button"
          onClick={logout}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
