'use client'

import Link from 'next/link'
import { Palette, QrCode, Settings, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { getAuthUser } from '@/lib/authSession'
import { organizerAccentColorsFromTheme } from '@/lib/organizerAccentCss'

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
  /** Solo cuenta partner (menú marca blanca). */
  partnerBrand?: boolean
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
      tool: 'products',
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
      label: 'Pagos',
      icon: paymentsIcon,
      showDesktop: true,
      tool: 'payments',
    },
    {
      href: `${basePath}/brand`,
      label: 'Marca y dominios',
      icon: <Palette size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />,
      showDesktop: true,
      ownerOnly: true,
      partnerBrand: true,
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
  showPartnerBrand?: boolean
  hasMpToken?: boolean
}

export function EventOrganizerSidebar({
  eventTitle,
  basePath,
  pathname,
  onLogout,
  workspaceMembership,
  tools,
  showPartnerBrand = false,
  hasMpToken = false,
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

  const [mpState, setMpState] = useState<'normal' | 'connected' | 'hidden'>(
    hasMpToken ? 'hidden' : 'normal'
  )

  useEffect(() => {
    if (hasMpToken && mpState === 'normal') setMpState('connected')
    if (!hasMpToken) setMpState('normal')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMpToken])

  const allItems = useMemo(() => navItems(basePath), [basePath])

  const items = useMemo(() => {
    return allItems.filter(it => {
      if (it.partnerBrand && !showPartnerBrand) return false
      if (it.ownerOnly) return workspaceMembership === 'owner'
      if (it.tool) return tools[it.tool]
      return false
    })
  }, [allItems, tools, workspaceMembership, showPartnerBrand])

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
    const syncEmail = () => queueMicrotask(() => setEmailLabel(getAuthUser()?.email ?? ''))
    syncEmail()
    if (typeof window === 'undefined') return
    window.addEventListener('nubapay-auth-change', syncEmail)
    return () => window.removeEventListener('nubapay-auth-change', syncEmail)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      const activeIndex = desktopItems.findIndex(item => isRouteActive(pathname, item.href))
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
                <span className="shrink-0" style={{ color: myEventsActive ? 'rgba(10,15,0,0.35)' : '#D1D5DB' }}>/</span>
                <span className="font-semibold truncate" style={{ color: myEventsActive ? ORG_INK : '#111827' }}>{title}</span>
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
            const active = isRouteActive(pathname, item.href)
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
            href={`${basePath}/cuenta/mercadopago`}
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
              <svg width="18" height="14" viewBox="206 130 288 210" fill="none" className="shrink-0" aria-hidden>
                <path fill="#00bcff" d="m350.04,138.92c-77.83,0-140.91,40.36-140.91,90.15s63.09,94.05,140.91,94.05,140.91-44.27,140.91-94.05-63.09-90.15-140.91-90.15Z"/>
                <path fill="#fff" d="m304.18,201.2c-.07.14-1.45,1.56-.55,2.71,2.18,2.78,8.91,4.38,15.72,2.85,4.05-.91,9.25-5.04,14.28-9.03,5.45-4.33,10.86-8.67,16.3-10.39,5.76-1.83,9.45-1.05,11.89-.31,2.67.8,5.82,2.56,10.84,6.32,9.45,7.1,47.43,40.26,54,45.99,5.28-2.39,30.47-12.56,62.39-19.6-2.78-17.02-13.01-33.25-28.72-45.99-21.89,9.19-50.42,14.7-76.58,1.93-.13-.05-14.29-6.75-28.25-6.42-20.75.48-29.74,9.46-39.25,18.97l-12.05,12.99Z"/>
                <path fill="#fff" d="m425.1,242.95c-.45-.4-44.67-39.09-54.69-46.62-5.8-4.35-9.02-5.46-12.41-5.89-1.76-.23-4.2.1-5.9.57-4.66,1.27-10.75,5.34-16.16,9.63-5.6,4.46-10.88,8.66-15.79,9.76-6.26,1.4-13.91-.25-17.4-2.61-1.41-.95-2.41-2.05-2.89-3.16-1.29-2.99,1.09-5.38,1.48-5.78l12.2-13.2c1.42-1.41,2.85-2.83,4.31-4.23-3.94.51-7.58,1.52-11.12,2.5-4.42,1.24-8.68,2.42-12.98,2.42-1.8,0-11.42-1.58-13.25-2.07-11.05-3.02-23.56-5.97-38.04-12.73-17.35,12.91-28.65,28.77-32,46.56,2.49.66,9.02,2.15,10.71,2.52,39.26,8.73,51.49,17.72,53.71,19.6,2.4-2.67,5.87-4.36,9.73-4.36,4.35,0,8.26,2.19,10.64,5.56,2.25-1.78,5.35-3.3,9.36-3.29,1.82,0,3.71.34,5.62.98,4.43,1.52,6.72,4.47,7.9,7.14,1.48-.67,3.31-1.17,5.46-1.16,2.12,0,4.32.48,6.53,1.44,7.24,3.11,8.36,10.22,7.71,15.58.52-.06,1.04-.08,1.56-.08,8.58,0,15.56,6.98,15.56,15.57,0,2.66-.68,5.16-1.86,7.35,2.34,1.31,8.29,4.28,13.52,3.62,4.17-.53,5.76-1.95,6.32-2.76.39-.55.8-1.2.42-1.66l-11.08-12.3s-1.82-1.73-1.22-2.39c.62-.68,1.75.3,2.55.96,5.64,4.71,12.52,11.81,12.52,11.81.12.08.57.98,3.12,1.43,2.19.39,6.07.17,8.76-2.04.67-.56,1.35-1.25,1.93-1.97-.05.04-.09.08-.13.1,2.84-3.63-.32-7.29-.32-7.29l-12.93-14.52s-1.85-1.71-1.22-2.4c.56-.6,1.75.3,2.56.98,4.09,3.42,9.88,9.23,15.42,14.66,1.09.79,5.96,3.8,12.41-.43,3.92-2.57,4.7-5.73,4.59-8.1-.27-3.15-2.73-5.4-2.73-5.4l-17.66-17.76s-1.87-1.59-1.21-2.4c.54-.68,1.75.3,2.55.96,5.62,4.71,20.86,18.68,20.86,18.68.22.15,5.48,3.9,11.99-.24,2.33-1.49,3.81-3.73,3.94-6.34.22-4.52-2.96-7.2-2.96-7.2Z"/>
                <path fill="#fff" d="m339.41,265.46c-2.74-.03-5.74,1.6-6.13,1.36-.22-.14.17-1.24.42-1.88.27-.63,3.87-11.48-4.92-15.25-6.73-2.89-10.85.36-12.26,1.83-.37.38-.54.35-.58-.13-.14-1.96-1.01-7.24-6.82-9.02-8.3-2.54-13.64,3.25-14.99,5.35-.61-4.73-4.61-8.4-9.5-8.41-5.32,0-9.64,4.3-9.65,9.63,0,5.32,4.31,9.64,9.64,9.64,2.59,0,4.93-1.03,6.66-2.69.06.05.08.14.05.32-.41,2.39-1.15,11.04,7.92,14.57,3.64,1.41,6.73.36,9.29-1.43.76-.54.89-.31.78.41-.33,2.23.09,6.99,6.77,9.7,5.08,2.07,8.09-.04,10.07-1.87.86-.78,1.09-.65,1.14.56.24,6.44,5.59,11.56,12.09,11.57,6.7,0,12.13-5.41,12.13-12.1,0-6.7-5.42-12.06-12.12-12.13Z"/>
                <path fill="#0a0080" d="m350.01,135.19c-79.31,0-143.6,42.18-143.6,93.92,0,1.34-.02,5.03-.02,5.5,0,54.9,56.19,99.35,143.6,99.35s143.61-44.45,143.61-99.34v-5.51c0-51.74-64.29-93.92-143.59-93.92Zm137.12,83.51c-31.21,6.94-54.49,17.01-60.32,19.61-13.62-11.89-45.1-39.26-53.63-45.66-4.87-3.67-8.2-5.6-11.12-6.47-1.31-.4-3.12-.85-5.45-.85-2.17,0-4.5.39-6.93,1.17-5.51,1.75-11,6.11-16.31,10.33l-.27.22c-4.95,3.93-10.06,8-13.93,8.86-1.69.38-3.43.58-5.16.58-4.34,0-8.23-1.26-9.69-3.12-.24-.31-.08-.81.48-1.52l.07-.1,11.99-12.91c9.39-9.39,18.25-18.25,38.66-18.72.34-.01.68-.02,1.02-.02,12.7.01,25.4,5.69,26.83,6.36,11.91,5.81,24.21,8.76,36.56,8.77,12.85,0,26.11-3.17,40.05-9.58,14.56,12.24,24.21,26.99,27.15,43.06Zm-137.1-77.97c42.1,0,79.76,12.07,105.09,31.07-12.24,5.3-23.91,7.97-35.17,7.97-11.52-.01-23.03-2.78-34.21-8.23-.59-.28-14.61-6.89-29.2-6.9-.38,0-.77,0-1.15.01-17.14.4-26.8,6.49-33.29,11.82-6.31.16-11.76,1.68-16.61,3.03-4.33,1.2-8.06,2.24-11.7,2.24-1.5,0-4.2-.14-4.44-.15-4.18-.13-25.18-5.28-41.95-11.61,25.27-17.96,61.89-29.26,102.64-29.26Zm-107.61,33.01c17.51,7.16,38.76,12.7,45.48,13.13,1.87.12,3.87.34,5.87.34,4.46,0,8.91-1.25,13.21-2.45,2.54-.71,5.35-1.49,8.3-2.05-.79.77-1.58,1.56-2.37,2.35l-12.17,13.17c-.96.97-3.04,3.55-1.67,6.73.54,1.28,1.65,2.51,3.2,3.55,2.9,1.95,8.1,3.28,12.92,3.28,1.83,0,3.57-.18,5.15-.54,5.11-1.14,10.46-5.41,16.13-9.92,4.52-3.59,10.94-8.15,15.86-9.49,1.38-.37,3.06-.61,4.42-.61.41,0,.79.02,1.14.07,3.24.41,6.38,1.51,11.99,5.72,10,7.51,54.22,46.2,54.65,46.58.03.02,2.85,2.46,2.65,6.5-.11,2.26-1.36,4.26-3.54,5.65-1.89,1.2-3.83,1.81-5.8,1.81-2.96,0-4.99-1.39-5.13-1.48-.16-.13-15.31-14.03-20.89-18.7-.89-.74-1.75-1.4-2.62-1.4-.47,0-.88.2-1.16.55-.88,1.08.1,2.58,1.26,3.56l17.7,17.8s2.21,2.06,2.45,4.79c.14,2.95-1.27,5.42-4.2,7.34-2.09,1.38-4.2,2.07-6.27,2.07-2.72,0-4.63-1.24-5.05-1.53l-2.54-2.5c-4.64-4.57-9.43-9.29-12.94-12.21-.86-.71-1.77-1.37-2.64-1.37-.43,0-.82.16-1.12.48-.4.44-.68,1.24.32,2.57.4.55.89,1,.89,1l12.91,14.51c.1.13,2.66,3.17.29,6.19l-.46.58c-.39.42-.8.82-1.2,1.16-2.2,1.81-5.14,2-6.31,2-.63,0-1.22-.05-1.75-.15-1.27-.23-2.13-.58-2.55-1.07l-.16-.16c-.7-.73-7.21-7.38-12.6-11.87-.71-.6-1.6-1.34-2.51-1.34-.45,0-.85.18-1.17.52-1.06,1.17.54,2.91,1.22,3.55l11.01,12.15c-.01.11-.15.36-.41.74-.4.55-1.73,1.88-5.73,2.38-.48.06-.98.09-1.46.09-4.12,0-8.52-2-10.79-3.2,1.03-2.18,1.57-4.58,1.57-6.98,0-9.07-7.36-16.44-16.43-16.45-.19,0-.4,0-.59.01.29-4.14-.29-11.98-8.34-15.43-2.32-1-4.63-1.52-6.87-1.52-1.76,0-3.45.3-5.04.91-1.67-3.24-4.44-5.6-8.04-6.83-2-.69-3.98-1.04-5.9-1.04-3.35,0-6.44.99-9.19,2.94-2.64-3.28-6.62-5.22-10.81-5.22-3.67,0-7.2,1.47-9.81,4.06-3.43-2.62-17.03-11.26-53.44-19.53-1.74-.39-5.69-1.52-8.17-2.25,3.41-16.34,13.8-31.27,29.2-43.52Zm67.54,94.78l-.39-.35h-.4c-.32,0-.66.13-1.11.45-1.86,1.31-3.63,1.94-5.44,1.94-1,0-2.02-.2-3.04-.59-8.44-3.29-7.78-11.25-7.36-13.65.06-.49-.06-.86-.37-1.12l-.6-.49-.56.53c-1.65,1.59-3.8,2.45-6.06,2.45-4.83,0-8.77-3.93-8.76-8.77,0-4.83,3.94-8.76,8.78-8.75,4.37,0,8.09,3.28,8.64,7.65l.3,2.35,1.29-1.99c.14-.23,3.69-5.59,10.2-5.58,1.24,0,2.52.2,3.81.6,5.19,1.58,6.07,6.29,6.2,8.25.09,1.14.91,1.2,1.06,1.2.45,0,.78-.28,1.01-.53.98-1.02,3.11-2.72,6.45-2.72,1.53,0,3.15.37,4.83,1.09,8.25,3.54,4.51,14.02,4.47,14.13-.71,1.74-.74,2.5-.07,2.95l.32.15h.24c.37,0,.83-.16,1.6-.42,1.12-.39,2.81-.97,4.4-.97h0c6.21.07,11.26,5.13,11.26,11.26,0,6.2-5.06,11.24-11.27,11.24-6.07,0-11.01-4.73-11.23-10.74-.02-.52-.07-1.88-1.23-1.88-.47,0-.89.29-1.36.72-1.34,1.24-3.04,2.49-5.52,2.49-1.13,0-2.35-.26-3.64-.79-6.41-2.6-6.5-7-6.24-8.77.07-.47.09-.96-.23-1.35Zm40.07,48.88c-76.26,0-138.08-39.55-138.08-88.33,0-1.96.14-3.91.33-5.84.61.15,6.67,1.59,7.92,1.88,37.19,8.26,49.48,16.85,51.56,18.48-.7,1.69-1.07,3.51-1.07,5.35,0,7.69,6.25,13.95,13.93,13.95.86,0,1.72-.08,2.56-.24,1.16,5.66,4.86,9.95,10.51,12.15,1.65.63,3.32.96,4.97.96,1.06,0,2.13-.13,3.17-.39,1.05,2.65,3.39,5.96,8.65,8.09,1.84.74,3.68,1.13,5.47,1.13,1.46,0,2.89-.26,4.25-.76,2.52,6.13,8.51,10.2,15.19,10.2,4.43,0,8.68-1.8,11.78-4.99,2.65,1.48,8.25,4.15,13.91,4.16.73,0,1.41-.05,2.11-.13,5.62-.71,8.23-2.91,9.43-4.62.22-.3.41-.62.58-.95,1.32.38,2.78.69,4.46.7,3.07,0,6.01-1.05,8.99-3.21,2.93-2.11,5.01-5.14,5.31-7.72,0-.03,0-.07.01-.11.99.2,2,.3,3.01.3,3.16,0,6.27-.98,9.24-2.93,5.73-3.75,6.72-8.66,6.63-11.87,1.01.21,2.03.32,3.05.32,2.96,0,5.88-.89,8.65-2.66,3.55-2.27,5.69-5.75,6.02-9.79.21-2.75-.47-5.53-1.91-7.91,9.58-4.13,31.48-12.12,57.27-17.93.11,1.46.17,2.93.17,4.41,0,48.78-61.82,88.33-138.07,88.33Z"/>
              </svg>
            )}
            <span>{mpState === 'connected' ? 'Pagos conectados' : 'Conectar pagos'}</span>
          </Link>
        </div>

        <div className="shrink-0 px-3 pb-3">
          <Link
            href={`${basePath}/cuenta`}
            className={`group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/70 ${
              isRouteActive(pathname, `${basePath}/cuenta`) ? 'bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : ''
            }`}
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

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-visible bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 items-end min-h-[56px] overflow-visible px-0.5 pt-1">
          {tabLeft && (
            <Link
              href={tabLeft.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabLeft.href) ? 'font-semibold' : 'text-gray-400'
              }`}
              style={
                isRouteActive(pathname, tabLeft.href) ? { color: ORG_INK } : undefined
              }
            >
              {tabLeft.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabLeft.label}</span>
            </Link>
          )}
          {tabMid && (
            <Link
              href={tabMid.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabMid.href) ? 'font-semibold' : 'text-gray-400'
              }`}
              style={
                isRouteActive(pathname, tabMid.href) ? { color: ORG_INK } : undefined
              }
            >
              {tabMid.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabMid.label}</span>
            </Link>
          )}

          <div className="relative z-10 flex flex-col items-center justify-end overflow-visible pb-1">
            {fabItem && (
              <Link
                href={fabItem.href}
                data-tour={fabItem.tourId}
                className="flex flex-col items-center gap-1 -mt-7 transition-colors"
                style={{ color: tintedShell ? ORG_INK : undefined }}
                aria-label={fabItem.label}
              >
                <span
                  className={`flex size-[52px] shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg transition-transform active:scale-95 ${
                    tintedShell
                      ? ''
                      : `bg-gray-900 text-white ${isRouteActive(pathname, fabItem.href) ? 'bg-gray-950' : ''}`
                  }`}
                  style={
                    tintedShell
                      ? {
                          backgroundColor: ORG_ACC,
                          color: ORG_INK,
                          borderColor: '#fff',
                        }
                      : undefined
                  }
                >
                  {fabItem.icon}
                </span>
                <span className={`text-[9px] font-semibold leading-none ${tintedShell ? '' : 'text-gray-900'}`}>{fabItem.label}</span>
              </Link>
            )}
          </div>

          {tabRight && (
            <Link
              href={tabRight.href}
              className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
                isRouteActive(pathname, tabRight.href) ? 'font-semibold' : 'text-gray-400'
              }`}
              style={
                isRouteActive(pathname, tabRight.href) ? { color: ORG_INK } : undefined
              }
            >
              {tabRight.icon}
              <span className="text-[9px] font-medium leading-none text-center px-0.5">{tabRight.label}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-end gap-1 py-2 min-h-[52px] transition-colors ${
              moreOverflowActive ? 'font-semibold' : 'text-gray-400'
            }`}
            style={
              moreOverflowActive ? { color: ORG_INK } : undefined
            }
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
