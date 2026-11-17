'use client'

import { useSyncExternalStore } from 'react'

import { getAuthToken, getAuthUser } from '@/lib/authSession'

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'nubapay_token' || e.key === 'nubapay_user' || e.key === null) onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener('nubapay-auth-change', onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('nubapay-auth-change', onChange)
  }
}

const getSnapshot = () => !!getAuthToken() && !!getAuthUser()
// El servidor no ve el localStorage: renderiza "sin sesión" y el cliente se corrige al hidratar.
const getServerSnapshot = () => false

/**
 * True si hay una sesión guardada (token y usuario) en este navegador; se mantiene al día con los
 * cambios de sesión de esta pestaña y de otras. No valida el token: de eso se ocupa `OrganizerGuard`.
 */
export function useLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
