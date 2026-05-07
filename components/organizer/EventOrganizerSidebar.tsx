'use client'

import Link from 'next/link'
import { QrCode, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { OrganizerStaffTools } from '@/lib/authSession'
import { getAuthUser } from '@/lib/authSession'

type ToolKey = keyof OrganizerStaffTools

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  showDesktop: boolean
  mobileTabOrder?: number
  mobileFab?: boolean
  /** Permiso requerido (omitir solo para ítems que usan `ownerOnly`). */
  tool?: ToolKey
  /** Solo visible para el dueño del evento (ej. equipo / staff). */
  ownerOnly?: boolean
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
  const storefrontIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 6l6-4 6 4v8H2V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  const staffIcon = <Users size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
  const scannerIcon = <QrCode size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />

  return [
    {
      href: `${basePath}/dashboard`,
      label: 'Dashboard',
      icon: dashIcon,
      showDesktop: true,
      mobileTabOrder: 0,
      tool: 'dashboard',
    },
    {
      href: `${basePath}/products`,
      label: 'Catálogo',
      icon: catalogIcon,
      showDesktop: true,
      mobileTabOrder: 1,
      tool: 'products',
    },
    {
      href: `${basePath}/scanner`,
      label: 'Escáner',
      icon: scannerIcon,
      showDesktop: true,
      mobileFab: true,
      tool: 'scanner',
    },
    {
      href: `${basePath}/orders`,
      label: 'Pedidos',
      icon: ordersIcon,
      showDesktop: true,
      mobileTabOrder: 2,
      tool: 'orders',
    },
    {
      href: `${basePath}/pickup-points`,
      label: 'Puntos de retiro',
      icon: pickupIcon,
      showDesktop: true,
      tool: 'pickup_points',
    },
    {
      href: `${basePath}/payments`,
      label: 'Pagos',
      icon: paymentsIcon,
      showDesktop: true,
      tool: 'payments',
    },
    {
      href: `${basePath}/staff`,
      label: 'Equipo',
      icon: staffIcon,
      showDesktop: true,
      ownerOnly: true,
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
  workspaceMembership: 'owner' | 'staff'
  tools: OrganizerStaffTools
}

export function EventOrganizerSidebar({
  eventTitle,
  basePath,
  pathname,
  onLogout,
  workspaceMembership,
  tools,
}: Props) {
  const allItems = useMemo(() => navItems(basePath), [basePath])

  const items = useMemo(() => {
    return allItems.filter(it => {
      if (it.ownerOnly) return workspaceMembership === 'owner'
      if (it.tool) return tools[it.tool]
      return false
    })
  }, [allItems, tools, workspaceMembership])

  const desktopItems = useMemo(() => items.filter(item => item.showDesktop), [items])
  const mobileTabs = useMemo(
    () =>
      items
        .filter(i => i.mobileTabOrder !== undefined && !i.mobileFab)
        .sort((a, b) => (a.mobileTabOrder ?? 0) - (b.mobileTabOrder ?? 0)),
    [items],
  )
  const fabItem = useMemo(() => items.find(i => i.mobileFab), [items])
  const tabLeft = mobileTabs[0]
  const tabMid = mobileTabs[1]
  const tabRight = mobileTabs[2]

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

  const moreOverflowHrefPrefixes = useMemo(
    () =>
      items
        .filter(i => i.mobileTabOrder === undefined && !i.mobileFab)
        .map(i => i.href),
    [items],
  )
  const moreOverflowActive = moreOverflowHrefPrefixes.some(h => pathname.startsWith(h))

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
      <aside className="hidden h-full min-h-0 w-[264px] shrink-0 flex-col overflow-hidden bg-gray-100 p-3 md:flex">
        <div className="px-3 pt-5 pb-4 mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-gray-900 tracking-tight">nubapay</span>
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">organizer</span>
          </div>
        </div>

        <nav ref={navRef} className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pt-2">
          {(() => {
            const myEventsHref = `${basePath}/all`
            const myEventsActive = isRouteActive(pathname, myEventsHref)
            return (
              <Link
                href={myEventsHref}
                className="relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors z-10"
                style={{
                  background: myEventsActive ? '#C6FF00' : 'transparent',
                  color: myEventsActive ? '#0A0F00' : '#6B7280',
                  fontWeight: myEventsActive ? 600 : 400,
                }}
              >
                <span className="shrink-0" style={{ color: myEventsActive ? '#0A0F00' : '#9CA3AF' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="shrink-0">Mis eventos</span>
                <span className="shrink-0" style={{ color: myEventsActive ? 'rgba(10,15,0,0.4)' : '#D1D5DB' }}>/</span>
                <span className="font-semibold truncate" style={{ color: myEventsActive ? '#0A0F00' : '#111827' }}>{title}</span>
              </Link>
            )
          })()}

          <div className="border-t border-gray-200 mx-3 mt-2.5 mb-5" />

          <div
            className="absolute inset-x-0 rounded-full pointer-events-none"
            style={{
              background: '#C6FF00',
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
                    active ? 'text-[#0A0F00] font-semibold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={active ? 'text-[#0A0F00]' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="mt-2 shrink-0 border-t border-gray-200 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-white uppercase">
                  {emailLabel ? emailLabel[0] : '?'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate" title={emailLabel}>{emailLabel || '…'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
              title="Cerrar sesión"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9.5 9.5L12 7l-2.5-2.5M12 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-visible bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 items-end min-h-[56px] overflow-visible px-0.5 pt-1">
          {tabLeft && (
            <Link
              href={tabLeft.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabLeft.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabLeft.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabLeft.label}</span>
            </Link>
          )}
          {tabMid && (
            <Link
              href={tabMid.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabMid.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabMid.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabMid.label}</span>
            </Link>
          )}

          <div className="relative z-10 flex flex-col items-center justify-end overflow-visible pb-1">
            {fabItem && (
              <Link href={fabItem.href} className="flex flex-col items-center gap-1 -mt-7 text-gray-900" aria-label={fabItem.label}>
                <span
                  className={`flex size-[52px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-gray-900 text-white shadow-lg transition-transform active:scale-95 ${
                    isRouteActive(pathname, fabItem.href) ? 'bg-gray-950' : ''
                  }`}
                >
                  {fabItem.icon}
                </span>
                <span className="text-[9px] font-semibold leading-none text-gray-900">{fabItem.label}</span>
              </Link>
            )}
          </div>

          {tabRight && (
            <Link
              href={tabRight.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabRight.href) ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tabRight.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabRight.label}</span>
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
