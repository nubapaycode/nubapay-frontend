'use client'

import Link from 'next/link'
import { Link2, QrCode } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getAuthUser } from '@/lib/authSession'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  /** Visible en sidebar desktop */
  showDesktop: boolean
  /** Tabs inferiores (no FAB): orden Dashboard → Catálogo → Pedidos */
  mobileTabOrder?: number
  /** Botón central elevado */
  mobileFab?: boolean
}

function navItems(basePath: string): NavItem[] {
  const dashIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
    </svg>
  )
  const ordersIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 3h12M2 8h12M2 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  const catalogIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  const customersIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 14c0-3 3-4 5-4s5 1 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  const paymentsIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 7h13M10 11h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  const pickupIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.25c-2.07 0-3.75 1.68-3.75 3.75 0 2.82 3.75 7.88 3.75 7.88s3.75-5.06 3.75-7.88c0-2.07-1.68-3.75-3.75-3.75z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="5" r="1.25" fill="currentColor" />
    </svg>
  )
  const scannerIcon = <QrCode size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />

  const linkPublicIcon = <Link2 size={16} className="shrink-0" strokeWidth={1.75} aria-hidden />

  return [
    {
      href: `${basePath}/dashboard`,
      label: 'Dashboard',
      icon: dashIcon,
      showDesktop: true,
      mobileTabOrder: 0,
    },
    {
      href: `${basePath}/storefront`,
      label: 'Link del catálogo',
      icon: linkPublicIcon,
      showDesktop: true,
    },
    {
      href: `${basePath}/products`,
      label: 'Catálogo',
      icon: catalogIcon,
      showDesktop: true,
      mobileTabOrder: 1,
    },
    {
      href: `${basePath}/scanner`,
      label: 'Escáner',
      icon: scannerIcon,
      showDesktop: true,
      mobileFab: true,
    },
    {
      href: `${basePath}/orders`,
      label: 'Pedidos',
      icon: ordersIcon,
      showDesktop: true,
      mobileTabOrder: 2,
    },
    {
      href: `${basePath}/pickup-points`,
      label: 'Puntos de retiro',
      icon: pickupIcon,
      showDesktop: true,
    },
    {
      href: `${basePath}/customers`,
      label: 'Clientes',
      icon: customersIcon,
      showDesktop: true,
    },
    {
      href: `${basePath}/payments`,
      label: 'Pagos',
      icon: paymentsIcon,
      showDesktop: true,
    },
  ]
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  eventTitle: string | null
  basePath: string
  pathname: string
  onLogout: () => void
}

export function EventOrganizerSidebar({
  eventTitle,
  basePath,
  pathname,
  onLogout,
}: Props) {
  const items = useMemo(() => navItems(basePath), [basePath])
  const desktopItems = useMemo(() => items.filter(item => item.showDesktop), [items])
  const mobileTabs = useMemo(
    () =>
      items
        .filter(i => i.mobileTabOrder !== undefined)
        .sort((a, b) => (a.mobileTabOrder ?? 0) - (b.mobileTabOrder ?? 0)),
    [items],
  )
  const fabItem = useMemo(() => items.find(i => i.mobileFab), [items])
  const tabDashboard = mobileTabs[0]
  const tabCatalog = mobileTabs[1]
  const tabOrders = mobileTabs[2]

  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pill, setPill] = useState<{ top: number; height: number; ready: boolean }>({ top: 0, height: 0, ready: false })
  const [emailLabel, setEmailLabel] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    setEmailLabel(getAuthUser()?.email ?? '')
  }, [])

  useEffect(() => {
    const activeIndex = desktopItems.findIndex(item => isRouteActive(pathname, item.href))
    if (activeIndex === -1) {
      setPill(p => ({ ...p, ready: false }))
      return
    }
    const el = itemRefs.current[activeIndex]
    if (!el) return
    setPill({ top: el.offsetTop, height: el.offsetHeight, ready: true })
  }, [pathname, desktopItems])

  useEffect(() => {
    if (!moreOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [moreOpen])

  const moreOverflowActive =
    pathname.startsWith(`${basePath}/customers`)
    || pathname.startsWith(`${basePath}/payments`)
    || pathname.startsWith(`${basePath}/pickup-points`)
    || pathname.startsWith(`${basePath}/storefront`)

  const title = eventTitle ?? 'Evento'

  const moreIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="3.5" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="12.5" r="1.25" fill="currentColor" />
    </svg>
  )

  return (
    <>
      <aside className="hidden md:flex w-[264px] shrink-0 bg-gray-100 min-h-screen flex-col p-3">
        <div className="px-3 py-4 mb-2 space-y-3">
          <div>
            <span className="text-base font-medium text-gray-900 tracking-tight">nubapay</span>
            <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">organizer</span>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span aria-hidden>←</span>
            Mis eventos
          </Link>
          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2" title={title}>
            {title}
          </p>
        </div>

        <nav ref={navRef} className="flex flex-col gap-2.5 flex-1 relative">
          <div
            className="absolute inset-x-0 rounded-full bg-gray-900 pointer-events-none"
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.ready ? 1 : 0,
              transition: pill.ready ? 'top 200ms cubic-bezier(0.4,0,0.2,1), height 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms' : 'none',
            }}
          />

          {desktopItems.map((item, i) => {
            const active = isRouteActive(pathname, item.href)
            return (
              <div key={item.href} ref={el => { itemRefs.current[i] = el }}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm z-10 transition-colors ${
                    active ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 mt-2 space-y-2">
          <p className="text-xs text-gray-400 truncate" title={emailLabel}>{emailLabel || '…'}</p>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 items-end min-h-[56px] px-0.5 pt-1">
          {tabDashboard && (
            <Link
              href={tabDashboard.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabDashboard.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabDashboard.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabDashboard.label}</span>
            </Link>
          )}
          {tabCatalog && (
            <Link
              href={tabCatalog.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabCatalog.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabCatalog.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabCatalog.label}</span>
            </Link>
          )}

          <div className="flex flex-col items-center justify-end pb-1 relative z-10">
            {fabItem && (
              <Link href={fabItem.href} className="flex flex-col items-center gap-1 -mt-7 text-gray-900" aria-label={fabItem.label}>
                <span
                  className={`flex items-center justify-center w-[52px] h-[52px] rounded-full shadow-lg ring-4 ring-white transition-transform active:scale-95 text-white ${
                    isRouteActive(pathname, fabItem.href) ? 'bg-gray-900 ring-gray-900/20' : 'bg-gray-900'
                  }`}
                >
                  {fabItem.icon}
                </span>
                <span className="text-[9px] font-semibold leading-none text-gray-900">{fabItem.label}</span>
              </Link>
            )}
          </div>

          {tabOrders && (
            <Link
              href={tabOrders.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabOrders.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabOrders.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabOrders.label}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
              moreOverflowActive ? 'text-gray-900' : 'text-gray-400'
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="Ver más herramientas"
          >
            {moreIcon}
            <span className="text-[8px] font-medium leading-tight text-center px-0.5">Ver más</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 z-[60] bg-black/45"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] max-h-[min(78vh,520px)] flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom,12px)] pt-2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="organizer-more-menu-title"
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-200" aria-hidden />
            <div className="px-4 pb-2 flex items-center justify-between shrink-0 border-b border-gray-100">
              <h2 id="organizer-more-menu-title" className="text-sm font-semibold text-gray-900">
                Herramientas
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                Cerrar
              </button>
            </div>
            <nav className="overflow-y-auto px-2 py-2">
              <ul className="flex flex-col gap-0.5">
                {items.map(item => {
                  const active = isRouteActive(pathname, item.href)
                  return (
                    <li key={`more-${item.href}`}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                          active ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={active ? 'text-gray-900' : 'text-gray-400'}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
