'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { type ParkingOwnerAccount, fetchParkingOwnerAccount } from '@/lib/parkingOwner'

type AccountContextValue = {
  account: ParkingOwnerAccount
  setAccount: (account: ParkingOwnerAccount) => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

/**
 * Carga una sola vez el estacionamiento del usuario (y crea su evento base la primera vez) y lo comparte
 * con las secciones del panel. Las secciones de configuración reutilizan las vistas de evento pasándoles
 * `account.base_event_id`.
 */
export function ParkingOwnerAccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<ParkingOwnerAccount | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    void fetchParkingOwnerAccount().then(r => {
      if (cancelled) return
      if (r.ok) {
        setAccount(r.data)
        setError('')
      } else {
        setError(r.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (!account) {
    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div role="alert" className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/70 p-6 text-center">
          <p className="text-[14px] text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('')
              setAttempt(n => n + 1)
            }}
            className="mt-3 rounded-xl bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-gray-800"
          >
            Reintentar
          </button>
        </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }

  return <AccountContext.Provider value={{ account, setAccount }}>{children}</AccountContext.Provider>
}

export function useParkingOwnerAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useParkingOwnerAccount debe usarse dentro de ParkingOwnerAccountProvider')
  return ctx
}
