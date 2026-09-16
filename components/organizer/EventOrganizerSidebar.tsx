'use client'

import Link from 'next/link'
import { Landmark, QrCode, Settings, User, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { getAuthUser } from '@/lib/authSession'
import { organizerAccentColorsFromTheme } from '@/lib/organizerAccentCss'
import type { WorkspaceSectionKey } from '@/lib/organizerWorkspaceSections'
import { visibleSectionTabs, WORKSPACE_SECTION_HUBS } from '@/lib/organizerWorkspaceSections'

type ToolKey = keyof OrganizerStaffTools

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  showDesktop: boolean
  mobileTabOrder?: number
  mobileFab?: boolean
  /** Permiso requerido. Sin `tool`, `ownerOnly` ni `section`, el ítem es visible para todos. */
  tool?: ToolKey
  /** Agrupa varias herramientas con pestañas; el href apunta a la primera permitida. */
  section?: WorkspaceSectionKey
  /** Rutas que marcan el ítem como activo (las pestañas de la sección). */
  matchHrefs?: string[]
  /** Solo visible para el dueño del evento (ej. equipo / staff). */
  ownerOnly?: boolean
  /** data-tour attribute for guided onboarding. */
  tourId?: string
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
      section: 'catalogo',
      tourId: 'sidebar-catalog',
    },
    {
      href: `${basePath}/scanner`,
      label: 'Escáner',
      icon: scannerIcon,
      showDesktop: false,
      mobileFab: true,
      tool: 'scanner',
      tourId: 'sidebar-scanner',
    },
    {
      href: `${basePath}/orders`,
      label: 'Pedidos',
      icon: ordersIcon,
      showDesktop: true,
      mobileTabOrder: 2,
      tool: 'orders',
      tourId: 'sidebar-orders',
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
      label: 'Cobros',
      icon: paymentsIcon,
      showDesktop: true,
      section: 'cobros',
    },
    {
      href: `${basePath}/staff`,
      label: 'Equipo',
      icon: staffIcon,
      showDesktop: true,
      ownerOnly: true,
    },
    {
      href: `${basePath}/config`,
      label: 'Configuración',
      icon: <Settings size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />,
      showDesktop: true,
      ownerOnly: true,
      tourId: 'sidebar-config',
    },
    {
      href: `${basePath}/cuenta`,
      label: 'Cuenta',
      icon: <User size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />,
      showDesktop: true,
      // Marca y dominios se abre desde Cuenta.
      matchHrefs: [`${basePath}/cuenta`, `${basePath}/brand`],
    },
  ]
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isItemActive(pathname: string, item: NavItem) {
  return (item.matchHrefs ?? [item.href]).some(href => isRouteActive(pathname, href))
}

type Props = {
  eventTitle: string | null
  basePath: string
  pathname: string
  onLogout: () => void
  workspaceMembership: 'owner' | 'staff'
  tools: OrganizerStaffTools
  hasMpToken?: boolean
  hasSipagoCredentials?: boolean
}

export function EventOrganizerSidebar({
  eventTitle,
  basePath,
  pathname,
  onLogout,
  workspaceMembership,
  tools,
  hasMpToken = false,
  hasSipagoCredentials = false,
}: Props) {
  const pubTheme = useOrganizerPublicTheme()
  const { bg: ORG_ACC, fg: ORG_INK } = useMemo(() => organizerAccentColorsFromTheme(pubTheme), [pubTheme])
  const tintedShell = pubTheme != null && pubTheme.inherit === false
  const pubBranding = tintedShell ? pubTheme.branding : null
  const brandLogo =
    typeof pubBranding?.logoUrl === 'string' && pubBranding.logoUrl.trim() !== ''
      ? pubBranding.logoUrl.trim()
      : ''
  const brandName =
    typeof pubBranding?.displayName === 'string' && pubBranding.displayName.trim() !== ''
      ? pubBranding.displayName.trim()
      : ''

  const hasAnyPaymentMethod = hasMpToken || hasSipagoCredentials
  const [mpState, setMpState] = useState<'normal' | 'connected' | 'hidden'>(
    hasAnyPaymentMethod ? 'hidden' : 'normal'
  )

  useEffect(() => {
    if (hasAnyPaymentMethod && mpState === 'normal') setMpState('connected')
    if (!hasAnyPaymentMethod) setMpState('normal')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyPaymentMethod])

  const allItems = useMemo(() => navItems(basePath), [basePath])

  const items = useMemo(() => {
    return allItems.flatMap((it): NavItem[] => {
      if (it.section) {
        const tabs = visibleSectionTabs(it.section, { membership: workspaceMembership, tools })
        if (tabs.length === 0) return []
        const hrefs = tabs.map(t => `${basePath}/${t.segment}`)
        const hub = WORKSPACE_SECTION_HUBS[it.section]
        if (hub) {
          const hubHref = `${basePath}/${hub}`
          return [{ ...it, href: hubHref, matchHrefs: [hubHref, ...hrefs] }]
        }
        return [{ ...it, href: hrefs[0], matchHrefs: hrefs }]
      }
      if (it.ownerOnly) return workspaceMembership === 'owner' ? [it] : []
      if (it.tool) return tools[it.tool] ? [it] : []
      return [it]
    })
  }, [allItems, tools, workspaceMembership, basePath])

  const desktopItems = useMemo(() => items.filter(item => item.showDesktop), [items])
  const mobileTabs = useMemo(
    () =>
      items
        .filter(i => i.mobileTabOrder !== undefined && !i.mobileFab)
        .sort((a, b) => (a.mobileTabOrder ?? 0) - (b.mobileTabOrder ?? 0)),
    [items],
  )
  const fabItem = useMemo(() => items.find(i => i.mobileFab), [items])
  /** Tabs a la izquierda / derecha del FAB; el FAB solo si hay permiso de escáner. */
  const tabsBeforeFab = useMemo(
    () => mobileTabs.filter(t => (t.mobileTabOrder ?? 0) < 2),
    [mobileTabs],
  )
  const tabsAfterFab = useMemo(
    () => mobileTabs.filter(t => (t.mobileTabOrder ?? 0) >= 2),
    [mobileTabs],
  )
  type MobileSlot =
    | { kind: 'tab'; item: NavItem }
    | { kind: 'fab'; item: NavItem }
    | { kind: 'more' }
  const mobileSlots = useMemo((): MobileSlot[] => {
    const slots: MobileSlot[] = [
      ...tabsBeforeFab.map(item => ({ kind: 'tab' as const, item })),
    ]
    if (fabItem) slots.push({ kind: 'fab', item: fabItem })
    slots.push(...tabsAfterFab.map(item => ({ kind: 'tab' as const, item })))
    slots.push({ kind: 'more' })
    return slots
  }, [tabsBeforeFab, tabsAfterFab, fabItem])

  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pill, setPill] = useState<{ top: number; height: number; ready: boolean }>({ top: 0, height: 0, ready: false })
  const [emailLabel, setEmailLabel] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [sheetDragY, setSheetDragY] = useState(0)
  const sheetDragStart = useRef(0)
  const sheetDragging = useRef(false)
  const navSwipeStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const syncEmail = () => queueMicrotask(() => setEmailLabel(getAuthUser()?.email ?? ''))
    syncEmail()
    if (typeof window === 'undefined') return
    window.addEventListener('nubapay-auth-change', syncEmail)
    return () => window.removeEventListener('nubapay-auth-change', syncEmail)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      const activeIndex = desktopItems.findIndex(item => isItemActive(pathname, item))
      if (activeIndex === -1) {
        setPill(p => ({ ...p, ready: false }))
        return
      }
      const el = itemRefs.current[activeIndex]
      if (!el) return
      setPill({ top: el.offsetTop, height: el.offsetHeight, ready: true })
    })
  }, [pathname, desktopItems])

  useEffect(() => {
    if (!moreOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [moreOpen])

  const moreOverflowActive = items.some(
    i => i.mobileTabOrder === undefined && !i.mobileFab && isItemActive(pathname, i),
  )

  const title = eventTitle

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
          {brandLogo ? (
            <div className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL remota de marca configurada */}
              <img src={brandLogo} alt="" className="h-6 max-w-[136px] w-auto object-contain object-left" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Organizer</span>
            </div>
          ) : brandName ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-gray-900 tracking-tight">{brandName}</span>
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">organizer</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-gray-900 tracking-tight">nubapay</span>
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">organizer</span>
            </div>
          )}
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
                  background: myEventsActive ? ORG_ACC : 'transparent',
                  color: myEventsActive ? ORG_INK : '#6B7280',
                  fontWeight: myEventsActive ? 600 : 400,
                }}
              >
                <span className="shrink-0" style={{ color: myEventsActive ? ORG_INK : '#9CA3AF' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="shrink-0">Mis eventos</span>
                {title && (
                  <>
                    <span className="shrink-0" style={{ color: myEventsActive ? 'rgba(10,15,0,0.35)' : '#D1D5DB' }}>/</span>
                    <span className="font-semibold truncate" style={{ color: myEventsActive ? ORG_INK : '#111827' }}>{title}</span>
                  </>
                )}
              </Link>
            )
          })()}

          <div className="border-t border-gray-200 mx-3 mt-2.5 mb-0" />

          <div
            className="absolute inset-x-0 rounded-full pointer-events-none"
            style={{
              background: ORG_ACC,
              top: pill.top,
              height: pill.height,
              opacity: pill.ready ? 1 : 0,
              transition: pill.ready ? 'top 200ms cubic-bezier(0.4,0,0.2,1), height 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms' : 'none',
            }}
          />

          {desktopItems.map((item, i) => {
            const active = isItemActive(pathname, item)
            return (
              <div key={item.href} ref={el => { itemRefs.current[i] = el }}>
                <Link
                  href={item.href}
                  data-tour={item.tourId}
                  className={`relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm z-10 transition-colors ${
                    active ? 'font-semibold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  style={active ? { color: ORG_INK } : undefined}
                >
                  <span className={`shrink-0 ${active ? '' : 'text-gray-400'}`} style={active ? { color: ORG_INK } : undefined}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </div>
            )
          })}
        </nav>

        <div
          className="mt-1 shrink-0 border-t border-gray-200 px-3 overflow-hidden"
          style={{
            maxHeight: mpState === 'hidden' ? 0 : 80,
            opacity: mpState === 'hidden' ? 0 : 1,
            paddingTop: mpState === 'hidden' ? 0 : 12,
            paddingBottom: mpState === 'hidden' ? 0 : 10,
            transition: mpState === 'hidden'
              ? 'max-height 0.6s ease, opacity 0.5s ease, padding-top 0.6s ease, padding-bottom 0.6s ease'
              : 'none',
          }}
        >
          <Link
            href={`${basePath}/metodos-pago`}
            className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
              mpState === 'connected'
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-[#009EE3]/20 bg-[#009EE3]/5 text-[#007DBE] hover:bg-[#009EE3]/10'
            }`}
            style={mpState === 'connected' ? { animation: 'mp-connected-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' } : undefined}
            onAnimationEnd={() => { if (mpState === 'connected') setMpState('hidden') }}
          >
            <style>{`
              @keyframes mp-connected-pop {
                0%   { transform: scale(0.95); opacity: 0.7; }
                60%  { transform: scale(1.03); }
                100% { transform: scale(1);    opacity: 1; }
              }
            `}</style>
            {mpState === 'connected' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden>
                <circle cx="7" cy="7" r="6.5" fill="#22c55e" />
                <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <Landmark size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
            )}
            <span>{mpState === 'connected' ? 'Pagos conectados' : 'Conectar pagos'}</span>
          </Link>
        </div>

        <div className="shrink-0 px-3 pb-3">
          <Link
            href={`${basePath}/cuenta`}
            className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/70"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
              aria-hidden
            >
              <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1.5 11.5c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <p className="min-w-0 flex-1 truncate text-[12px] text-gray-500 group-hover:text-gray-800 transition-colors" title={emailLabel}>
              {emailLabel || '…'}
            </p>
            <button
              type="button"
              onClick={e => { e.preventDefault(); onLogout() }}
              className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Cerrar sesión"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9.5 9.5L12 7l-2.5-2.5M12 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Link>
        </div>
      </aside>

      {/* mejora 1: swipe-up sobre la barra abre "Ver más" */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-visible bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Navegación principal"
        onTouchStart={e => {
          navSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={e => {
          if (!navSwipeStart.current) return
          const dx = Math.abs(e.changedTouches[0].clientX - navSwipeStart.current.x)
          const dy = navSwipeStart.current.y - e.changedTouches[0].clientY
          navSwipeStart.current = null
          if (dy > 50 && dx < 40 && !moreOpen) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8)
            setMoreOpen(true)
          }
        }}
      >
        <div className="flex w-full items-end justify-center min-h-[56px] overflow-visible px-1 pt-1">
          {mobileSlots.map(slot => {
            if (slot.kind === 'fab') {
              const fabActive = isItemActive(pathname, slot.item)
              return (
                <div
                  key={`fab-${slot.item.href}`}
                  className="relative z-10 flex min-w-0 flex-1 max-w-[5.5rem] flex-col items-center justify-end overflow-visible pb-1"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) * 0.5 + 4px)' }}
                >
                  <Link
                    href={slot.item.href}
                    data-tour={slot.item.tourId}
                    className="flex flex-col items-center gap-1 -mt-7 transition-colors"
                    style={{ color: ORG_INK }}
                    aria-label={slot.item.label}
                    onClick={() => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8) }}
                  >
                    <span className="relative">
                      {fabActive && (
                        <span
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{ backgroundColor: ORG_ACC, opacity: 0.35 }}
                          aria-hidden
                        />
                      )}
                      <span
                        className="relative flex size-[52px] shrink-0 items-center justify-center rounded-full border-4 shadow-lg transition-transform active:scale-95"
                        style={{
                          backgroundColor: ORG_ACC,
                          color: ORG_INK,
                          borderColor: '#fff',
                          boxShadow: fabActive
                            ? `0 0 0 3px color-mix(in srgb, ${ORG_ACC} 40%, transparent), 0 4px 12px rgba(0,0,0,0.18)`
                            : undefined,
                        }}
                      >
                        {slot.item.icon}
                      </span>
                    </span>
                    <span className="text-[9px] font-semibold leading-none" style={{ color: ORG_INK }}>
                      {slot.item.label}
                    </span>
                  </Link>
                </div>
              )
            }

            if (slot.kind === 'more') {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8)
                    setMoreOpen(true)
                  }}
                  className="flex min-w-0 flex-1 max-w-[5.5rem] flex-col items-center justify-end gap-1 py-2 min-h-[52px]"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                  aria-label="Ver más herramientas"
                >
                  <span className="relative flex items-center justify-center">
                    <span
                      className="flex items-center justify-center rounded-full transition-all duration-150"
                      style={
                        moreOverflowActive
                          ? { background: `color-mix(in srgb, ${ORG_ACC} 18%, transparent)`, width: 36, height: 24, color: ORG_INK }
                          : { width: 36, height: 24, color: '#9CA3AF' }
                      }
                    >
                      {moreIcon}
                    </span>
                    {moreOverflowActive && (
                      <span
                        className="absolute top-0 right-0 size-[7px] rounded-full border border-white"
                        style={{ backgroundColor: ORG_ACC }}
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className="text-[9px] leading-none text-center"
                    style={{
                      color: moreOverflowActive ? ORG_INK : '#9CA3AF',
                      fontWeight: moreOverflowActive ? 600 : 400,
                      opacity: moreOverflowActive ? 1 : 0,
                      transition: 'color 150ms, opacity 150ms',
                    }}
                  >
                    Ver más
                  </span>
                </button>
              )
            }

            const active = isItemActive(pathname, slot.item)
            return (
              <Link
                key={slot.item.href}
                href={slot.item.href}
                className="flex min-w-0 flex-1 max-w-[5.5rem] flex-col items-center justify-end gap-1 py-2 min-h-[52px]"
                onClick={() => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8) }}
              >
                <span
                  className="flex items-center justify-center rounded-full transition-all duration-150"
                  style={
                    active
                      ? { background: `color-mix(in srgb, ${ORG_ACC} 18%, transparent)`, width: 36, height: 24, color: ORG_INK }
                      : { width: 36, height: 24, color: '#9CA3AF' }
                  }
                >
                  {slot.item.icon}
                </span>
                <span
                  className="text-[9px] leading-none text-center"
                  style={{
                    color: active ? ORG_INK : '#9CA3AF',
                    fontWeight: active ? 600 : 400,
                    opacity: active ? 1 : 0,
                    transition: 'color 150ms, opacity 150ms',
                  }}
                >
                  {slot.item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {moreOpen && (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 z-[60] bg-black/45"
            aria-label="Cerrar menú"
            onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
          />
          {/* mejora 4: swipe-to-dismiss en el bottom sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] max-h-[min(78vh,520px)] flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pt-2"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
              transform: `translateY(${sheetDragY}px)`,
              transition: sheetDragging.current ? 'none' : 'transform 300ms cubic-bezier(0.32,0.72,0,1)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="organizer-more-menu-title"
            onTouchStart={e => {
              sheetDragStart.current = e.touches[0].clientY
              sheetDragging.current = true
            }}
            onTouchMove={e => {
              const dy = Math.max(0, e.touches[0].clientY - sheetDragStart.current)
              setSheetDragY(dy)
            }}
            onTouchEnd={() => {
              sheetDragging.current = false
              if (sheetDragY > 80) {
                setMoreOpen(false)
                setSheetDragY(0)
              } else {
                setSheetDragY(0)
              }
            }}
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-200 cursor-grab" aria-hidden />
            <div className="px-4 pb-2 flex items-center justify-between shrink-0 border-b border-gray-100">
              <h2 id="organizer-more-menu-title" className="text-sm font-semibold text-gray-900">
                Herramientas
              </h2>
              <button
                type="button"
                onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                Cerrar
              </button>
            </div>
            <nav className="overflow-y-auto px-2 py-2">
              <ul className="flex flex-col gap-0.5">
                {items.map(item => {
                  const active = isItemActive(pathname, item)
                  return (
                    <li key={`more-${item.href}`}>
                      <Link
                        href={item.href}
                        onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
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
