'use client'

import { CalendarDays, Car, CreditCard, QrCode, ReceiptText, Settings, Store, Users } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { EventOrganizerSidebar, type NavItem } from '@/components/organizer/EventOrganizerSidebar'
import { KeyboardShortcutsDialog } from '@/components/organizer/KeyboardShortcutsDialog'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import { PARKING_OWNER_HOME, hasModule } from '@/lib/modules'
import { ORGANIZER_FULL_TOOLS } from '@/lib/organizerStaffTools'

const icon = (Icon: typeof CalendarDays, size = 16) => <Icon size={size} strokeWidth={1.75} aria-hidden />

/**
 * Secciones del panel del estacionamiento, con los mismos grupos que la barra de un evento. Vehículos va en
 * "Operación" junto al escáner (es lo que se usa en la entrada); cada sección muestra su título.
 * Pedidos, Escáner y Cobros muestran todos los eventos juntos; Vehículos, Tienda y Equipo se configuran una
 * vez y los heredan todos los eventos. Vehículos y Tienda solo aparecen con su módulo (parking / catálogo).
 * Los avisos se mandan desde cada evento. Los atajos (G + tecla) son los mismos que en un evento.
 */
const PARKING_NAV: NavItem[] = [
  { href: `${PARKING_OWNER_HOME}/eventos`, label: 'Eventos', icon: icon(CalendarDays), group: 'principal', showDesktop: true, mobileTabOrder: 0 },
  { href: `${PARKING_OWNER_HOME}/escaner`, label: 'Escáner', icon: icon(QrCode, 20), group: 'principal', showDesktop: true, mobileFab: true, shortcut: 's' },
  { href: `${PARKING_OWNER_HOME}/vehiculos`, label: 'Vehículos', icon: icon(Car), group: 'principal', showDesktop: true, mobileTabOrder: 1, module: 'parking' },
  { href: `${PARKING_OWNER_HOME}/pedidos`, label: 'Pedidos', icon: icon(ReceiptText), group: 'principal', showDesktop: true, mobileTabOrder: 2, shortcut: 'p' },
  { href: `${PARKING_OWNER_HOME}/cobros`, label: 'Cobros', icon: icon(CreditCard), group: 'principal', showDesktop: true, shortcut: 'b' },
  { href: `${PARKING_OWNER_HOME}/tienda`, label: 'Tienda', icon: icon(Store), group: 'venta', showDesktop: true, module: 'catalogo' },
  { href: `${PARKING_OWNER_HOME}/equipo`, label: 'Equipo', icon: icon(Users), group: 'ajustes', showDesktop: true, shortcut: 'e' },
  { href: `${PARKING_OWNER_HOME}/configuracion`, label: 'Configuración', icon: icon(Settings), group: 'ajustes', showDesktop: true, shortcut: 'a' },
]

/** Marco del panel del estacionamiento: el mismo del panel de un evento (barra lateral + contenido). */
export function ParkingOwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { account } = useParkingOwnerAccount()
  // El guard ya refrescó el usuario contra /auth/me: los módulos están al día.
  const nav = useMemo(() => {
    const modules = getAuthUser()?.modules ?? []
    return PARKING_NAV.filter(it => !it.module || hasModule(modules, it.module))
  }, [])

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-row overflow-hidden bg-gray-100">
      <EventOrganizerSidebar
        eventTitle={account.name}
        basePath={PARKING_OWNER_HOME}
        pathname={pathname}
        workspaceMembership="owner"
        tools={ORGANIZER_FULL_TOOLS}
        navItemsOverride={nav}
        switcher={{ href: `${PARKING_OWNER_HOME}/configuracion`, caption: 'Estacionamiento', hint: 'Configurar el estacionamiento' }}
        paymentsHref={`${PARKING_OWNER_HOME}/cobros/metodos-pago`}
        accountHref={null}
        showSearch={false}
        groupLabels={{ principal: 'Operación' }}
        showGroupTitles
        hasMpToken={account.payments?.mp ?? false}
        hasSipagoCredentials={account.payments?.sipago ?? false}
        hasMobbexCredentials={account.payments?.mobbex ?? false}
        onLogout={() => {
          clearAuthSession()
          router.replace('/')
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-tl-3xl md:rounded-bl-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-0">
          {/* Mismo margen que las páginas del panel de un evento. */}
          <main className="w-full min-w-0 max-w-none p-4 pt-10 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">{children}</main>
        </div>
      </div>
      <KeyboardShortcutsDialog />
    </div>
  )
}
