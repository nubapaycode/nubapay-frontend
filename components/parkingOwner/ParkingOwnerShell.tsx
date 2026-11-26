'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ParkingSquare } from 'lucide-react'

import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import { PARKING_OWNER_HOME } from '@/lib/modules'
import { cn } from '@/lib/utils'

/**
 * Secciones del panel global. Pedidos, Escáner, Cobros y Avisos muestran todos los eventos juntos;
 * Vehículos, Tienda, Equipo y los métodos de pago se configuran una vez y los heredan todos los eventos.
 */
const NAV = [
  { href: `${PARKING_OWNER_HOME}/eventos`, label: 'Eventos' },
  { href: `${PARKING_OWNER_HOME}/pedidos`, label: 'Pedidos' },
  { href: `${PARKING_OWNER_HOME}/escaner`, label: 'Escáner' },
  { href: `${PARKING_OWNER_HOME}/cobros`, label: 'Cobros' },
  { href: `${PARKING_OWNER_HOME}/avisos`, label: 'Avisos' },
  { href: `${PARKING_OWNER_HOME}/vehiculos`, label: 'Vehículos' },
  { href: `${PARKING_OWNER_HOME}/tienda`, label: 'Tienda' },
  { href: `${PARKING_OWNER_HOME}/equipo`, label: 'Equipo' },
  { href: `${PARKING_OWNER_HOME}/configuracion`, label: 'Configuración' },
]

/** Marco del panel del dueño de estacionamiento: no pertenece a ningún evento puntual. */
export function ParkingOwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    clearAuthSession()
    router.replace('/ingresar')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href={PARKING_OWNER_HOME} className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <ParkingSquare size={18} strokeWidth={1.75} aria-hidden />
            Mi estacionamiento
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="Secciones del estacionamiento">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <span className="hidden text-[12px] text-gray-500 sm:block">{getAuthUser()?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut size={14} strokeWidth={1.75} aria-hidden />
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
