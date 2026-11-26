'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ChevronsUpDown,
  CreditCard,
  Keyboard,
  Landmark,
  LayoutGrid,
  LifeBuoy,
  Link2,
  LogOut,
  MapPin,
  Megaphone,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  Store,
  Ticket,
  Undo2,
  User,
  Users,
  ParkingSquare,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { OPEN_COMMAND_EVENT, OPEN_SHORTCUTS_EVENT } from '@/components/organizer/commandEvents'
import { isTypingTarget } from '@/components/organizer/KeyboardShortcutsDialog'
import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { getAuthUser } from '@/lib/authSession'
import { parkingPath, ticketsPath } from '@/lib/buyerRoutes'
import { hasModule, type ModuleKey } from '@/lib/modules'
import { PICKUP_POINTS_ENABLED } from '@/lib/features'
import { usePublicOrigin } from '@/lib/hooks/usePublicOrigin'
import { organizerAccentColorsFromTheme } from '@/lib/organizerAccentCss'
import { catalogPublicPath } from '@/lib/siteOrigin'
import type { WorkspaceSectionKey } from '@/lib/organizerWorkspaceSections'
import { visibleSectionTabs, WORKSPACE_SECTION_HUBS } from '@/lib/organizerWorkspaceSections'

type ToolKey = keyof OrganizerStaffTools

export type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  showDesktop: boolean
  mobileTabOrder?: number
  mobileFab?: boolean
  /** Módulo que el admin de plataforma habilitó al dueño del evento. Sin él, el ítem no se muestra. */
  module?: ModuleKey
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
  /** Sección de la sidebar de escritorio. */
  group: NavGroup
  /** Tecla que, después de "G", lleva a la herramienta (ej. G y D → Dashboard). */
  shortcut?: string
}

export type NavGroup = 'principal' | 'venta' | 'clientes' | 'ajustes'

/**
 * Secciones de la barra de escritorio. "Principal" (lo de todos los días) va siempre a la vista;
 * las demás son acordeones plegables para que la barra no se vea cargada.
 */
export const NAV_GROUPS: { key: NavGroup; label: string; collapsible: boolean }[] = [
  { key: 'principal', label: 'Principal', collapsible: false },
  { key: 'venta', label: 'Qué vendés', collapsible: true },
  { key: 'clientes', label: 'Clientes', collapsible: true },
  { key: 'ajustes', label: 'Ajustes', collapsible: true },
]

/** Secciones que arrancan plegadas la primera vez (se usan menos). */
const DEFAULT_CLOSED_GROUPS: NavGroup[] = ['clientes', 'ajustes']

function navItems(basePath: string): NavItem[] {
  const icon = (Icon: typeof LayoutGrid, size = 16) => (
    <Icon size={size} strokeWidth={1.75} className="shrink-0" aria-hidden />
  )
  const dashIcon = icon(LayoutGrid)
  const ordersIcon = icon(ReceiptText)
  const catalogIcon = icon(Package)
  const paymentsIcon = icon(CreditCard)
  const pickupIcon = icon(MapPin)
  const staffIcon = icon(Users)
  const ticketsIcon = icon(Ticket)
  const scannerIcon = icon(QrCode, 20)
  return [
    {
      href: `${basePath}/resumen`,
      shortcut: 'd',
      label: 'Dashboard',
      group: 'principal',
      icon: dashIcon,
      showDesktop: true,
      mobileTabOrder: 0,
      tool: 'dashboard',
    },
    {
      href: `${basePath}/productos`,
      shortcut: 'c',
      label: 'Catálogo',
      group: 'venta',
      icon: catalogIcon,
      showDesktop: true,
      mobileTabOrder: 1,
      section: 'catalogo',
      module: 'catalogo',
      tourId: 'sidebar-catalog',
    },
    {
      href: `${basePath}/tickets`,
      shortcut: 't',
      label: 'Tickets',
      group: 'venta',
      icon: ticketsIcon,
      showDesktop: true,
      tool: 'products',
      module: 'tickets',
    },
    {
      href: `${basePath}/tienda`,
      // Link, slug y portada de la tienda: se configura una vez, por eso va en Ajustes.
      label: 'Tienda',
      group: 'ajustes',
      icon: icon(Store),
      showDesktop: true,
      tool: 'storefront',
    },
    {
      href: `${basePath}/escaner`,
      shortcut: 's',
      label: 'Escáner',
      group: 'principal',
      icon: scannerIcon,
      showDesktop: true,
      mobileFab: true,
      tool: 'scanner',
      tourId: 'sidebar-scanner',
    },
    {
      // Junto al escáner: es lo que se opera en la entrada del estacionamiento.
      href: `${basePath}/parking`,
      label: 'Parking',
      group: 'principal',
      icon: icon(ParkingSquare),
      showDesktop: true,
      tool: 'products',
      module: 'parking',
    },
    {
      href: `${basePath}/pedidos`,
      shortcut: 'p',
      label: 'Pedidos',
      group: 'principal',
      icon: ordersIcon,
      showDesktop: true,
      mobileTabOrder: 2,
      tool: 'orders',
      tourId: 'sidebar-orders',
    },
    {
      href: `${basePath}/arrepentimientos`,
      label: 'Arrepentimientos',
      group: 'clientes',
      icon: icon(Undo2),
      showDesktop: true,
      tool: 'orders',
    },
    {
      href: `${basePath}/avisos`,
      label: 'Avisos',
      group: 'clientes',
      icon: icon(Megaphone),
      showDesktop: true,
      ownerOnly: true,
    },
    ...(PICKUP_POINTS_ENABLED
      ? [
          {
            href: `${basePath}/puntos-de-retiro`,
            shortcut: 'r',
            label: 'Puntos de retiro',
            group: 'venta' as const,
            icon: pickupIcon,
            showDesktop: true,
            tool: 'pickup_points' as const,
          },
        ]
      : []),
    {
      href: `${basePath}/pagos`,
      shortcut: 'b',
      label: 'Cobros',
      group: 'principal',
      icon: paymentsIcon,
      showDesktop: true,
      section: 'cobros',
    },
    {
      href: `${basePath}/equipo`,
      shortcut: 'e',
      label: 'Equipo',
      group: 'ajustes',
      icon: staffIcon,
      showDesktop: true,
      ownerOnly: true,
    },
    {
      href: `${basePath}/configuracion`,
      shortcut: 'a',
      label: 'Configuración',
      group: 'ajustes',
      icon: icon(Settings),
      showDesktop: true,
      ownerOnly: true,
      tourId: 'sidebar-config',
    },
    {
      href: `${basePath}/cuenta`,
      label: 'Cuenta',
      group: 'ajustes',
      icon: icon(User),
      // En escritorio se entra desde la card del perfil ("Mi cuenta"); en mobile queda en "Ver más".
      showDesktop: false,
      // Marca y dominios se abre desde Cuenta.
      matchHrefs: [`${basePath}/cuenta`, `${basePath}/marca`],
    },
  ]
}

/** Ítems de navegación que puede ver este integrante (permisos de staff y secciones con pestañas). */
export function visibleNavItems(
  basePath: string,
  tools: OrganizerStaffTools,
  workspaceMembership: 'owner' | 'staff',
  /** Módulos del dueño del evento (catalogo, tickets, parking). Ausente = los de por defecto. */
  modules?: readonly string[] | null,
): NavItem[] {
  return navItems(basePath).flatMap((it): NavItem[] => {
    if (it.module && !hasModule(modules, it.module)) return []
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
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isItemActive(pathname: string, item: NavItem) {
  return (item.matchHrefs ?? [item.href]).some(href => isRouteActive(pathname, href))
}

const COLLAPSE_KEY = 'nubapay_sidebar_collapsed'
const GROUPS_KEY = 'nubapay_sidebar_closed_groups'

type Props = {
  eventTitle: string | null
  /** Slug público del evento, para copiar los links de catálogo y tickets. */
  eventSlug?: string
  basePath: string
  pathname: string
  onLogout: () => void
  workspaceMembership: 'owner' | 'staff'
  tools: OrganizerStaffTools
  /** Módulos que ofrece el evento (los habilitados a su dueño). */
  modules?: string[]
  hasMpToken?: boolean
  hasSipagoCredentials?: boolean
  hasMobbexCredentials?: boolean
  /**
   * Para un panel que no es de un evento (dueño de estacionamiento): ítems propios en vez de las
   * herramientas del evento. Sin esto, la barra es la del evento.
   */
  navItemsOverride?: NavItem[]
  /** Tarjeta de arriba (por defecto "Evento · Cambiar de evento" → `mis-eventos`). */
  switcher?: { href: string; caption: string; hint: string }
  /** Destino de "Conectar pagos" (por defecto, los métodos de pago del evento). */
  paymentsHref?: string
  /** Destino de "Mi cuenta"; `null` lo oculta. */
  accountHref?: string | null
  /** El buscador (⌘K) recorre las herramientas del evento; fuera de un evento no se muestra. */
  showSearch?: boolean
  /** Nombres propios para las secciones (ej. "Operación" en vez de "Principal"). */
  groupLabels?: Partial<Record<NavGroup, string>>
  /** Muestra el título de cada sección aunque no sea acordeón (por defecto solo lo tienen los acordeones). */
  showGroupTitles?: boolean
  /** Acceso para volver a un panel superior (ej. el del estacionamiento, desde uno de sus eventos). */
  backLink?: { href: string; label: string }
}

export function EventOrganizerSidebar({
  eventTitle,
  eventSlug = '',
  basePath,
  pathname,
  onLogout,
  workspaceMembership,
  tools,
  modules,
  hasMpToken = false,
  hasSipagoCredentials = false,
  hasMobbexCredentials = false,
  navItemsOverride,
  switcher,
  paymentsHref,
  accountHref,
  showSearch = true,
  groupLabels,
  showGroupTitles = false,
  backLink,
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

  const hasAnyPaymentMethod = hasMpToken || hasSipagoCredentials || hasMobbexCredentials
  const [mpState, setMpState] = useState<'normal' | 'connected' | 'hidden'>(
    hasAnyPaymentMethod ? 'hidden' : 'normal'
  )

  useEffect(() => {
    if (hasAnyPaymentMethod && mpState === 'normal') setMpState('connected')
    if (!hasAnyPaymentMethod) setMpState('normal')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyPaymentMethod])

  const items = useMemo(
    () => navItemsOverride ?? visibleNavItems(basePath, tools, workspaceMembership, modules),
    [navItemsOverride, basePath, tools, workspaceMembership, modules],
  )

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
  // La documentación vive fuera del panel (/documentacion) y se abre en otra pestaña; `evento` permite volver acá.
  const docsUrl = `/documentacion?evento=${encodeURIComponent(basePath.split('/').filter(Boolean).pop() ?? '')}`
  const [sheetDragY, setSheetDragY] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'catalog' | 'tickets' | 'parking' | 'error' | null>(null)
  /** Submenú "Links públicos" dentro del popover del perfil. */
  const [linksOpen, setLinksOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const publicOrigin = usePublicOrigin()
  const slug = eventSlug.trim()
  // Cada link público solo se ofrece si el módulo está habilitado.
  const catalogUrl = slug && publicOrigin && hasModule(modules, 'catalogo') ? `${publicOrigin}${catalogPublicPath(slug)}` : ''
  const ticketsUrl = slug && publicOrigin && hasModule(modules, 'tickets') ? `${publicOrigin}${ticketsPath(slug)}` : ''
  const parkingUrl = slug && publicOrigin && hasModule(modules, 'parking') ? `${publicOrigin}${parkingPath(slug)}` : ''
  /** "Ver tienda" abre el primer módulo habilitado. */
  const storeUrl = catalogUrl || ticketsUrl || parkingUrl
  const sheetDragStart = useRef(0)
  const sheetDragging = useRef(false)
  const navSwipeStart = useRef<{ x: number; y: number } | null>(null)
  const router = useRouter()

  // Barra plegada (solo íconos). Se recuerda por navegador; si el storage falla, arranca expandida.
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1') queueMicrotask(() => setCollapsed(true))
    } catch {
      /* sin storage: queda expandida */
    }
  }, [])
  const toggleCollapsed = useCallback(() => {
    setCollapsed(c => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        /* sin storage: el cambio vale solo para esta visita */
      }
      return !c
    })
  }, [])

  // Secciones plegadas (acordeón). Se recuerdan por navegador.
  const [closedGroups, setClosedGroups] = useState<Set<NavGroup>>(() => new Set(DEFAULT_CLOSED_GROUPS))
  const persistClosedGroups = (next: Set<NavGroup>) => {
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify([...next]))
    } catch {
      /* sin storage: el cambio vale solo para esta visita */
    }
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const valid = parsed.filter((g): g is NavGroup => NAV_GROUPS.some(ng => ng.key === g))
      queueMicrotask(() => setClosedGroups(new Set(valid)))
    } catch {
      /* sin storage o valor inválido: quedan las de por defecto */
    }
  }, [])
  const toggleGroup = useCallback((key: NavGroup) => {
    setClosedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persistClosedGroups(next)
      return next
    })
  }, [])

  // Ancho de la barra como variable CSS, para centrar lo flotante (barras de selección) sobre el contenido.
  // En celular la barra lateral no está, así que vale 0.
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => root.style.setProperty('--nb-sidebar-w', mq.matches ? (collapsed ? '68px' : '264px') : '0px')
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      root.style.removeProperty('--nb-sidebar-w')
    }
  }, [collapsed])

  // Atajos: "G" y la letra del ítem para navegar; "[" pliega o expande la barra.
  useEffect(() => {
    let pendingUntil = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[aria-modal="true"]')) return
      const key = e.key.toLowerCase()
      if (pendingUntil > Date.now()) {
        pendingUntil = 0
        const target = items.find(i => i.shortcut === key)
        if (target) {
          e.preventDefault()
          router.push(target.href)
        }
        return
      }
      if (key === 'g') pendingUntil = Date.now() + 1200
      else if (e.key === '[' && window.matchMedia('(min-width: 768px)').matches) {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [items, router, toggleCollapsed])

  useEffect(() => {
    const syncEmail = () => queueMicrotask(() => setEmailLabel(getAuthUser()?.email ?? ''))
    syncEmail()
    if (typeof window === 'undefined') return
    window.addEventListener('nubapay-auth-change', syncEmail)
    return () => window.removeEventListener('nubapay-auth-change', syncEmail)
  }, [])

  /** Secciones con ítems visibles en la barra de escritorio. */
  const desktopGroups = useMemo(
    () =>
      NAV_GROUPS.map(group => ({
        group: { ...group, label: groupLabels?.[group.key] ?? group.label },
        groupItems: desktopItems
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.group === group.key),
      })).filter(g => g.groupItems.length > 0),
    [desktopItems, groupLabels],
  )

  /**
   * Una sección es acordeón solo con la barra expandida y si tiene más de un ítem
   * (un encabezado para un solo ítem es ruido). Plegada, se ven todos los íconos.
   */
  const isAccordion = useCallback(
    (key: NavGroup, count: number) =>
      !collapsed && count > 1 && NAV_GROUPS.some(g => g.key === key && g.collapsible),
    [collapsed],
  )

  const activeItem = desktopItems.find(item => isItemActive(pathname, item))
  const activeGroup = activeItem?.group

  // Al entrar a una herramienta (por link, atajo o buscador) se abre su sección.
  useEffect(() => {
    if (!activeGroup) return
    queueMicrotask(() =>
      setClosedGroups(prev => {
        if (!prev.has(activeGroup)) return prev
        const next = new Set(prev)
        next.delete(activeGroup)
        persistClosedGroups(next)
        return next
      }),
    )
  }, [pathname, activeGroup])

  const groupsRef = useRef<HTMLDivElement>(null)
  const measurePill = useCallback(() => {
    const activeIndex = desktopItems.findIndex(item => isItemActive(pathname, item))
    const item = desktopItems[activeIndex]
    const count = item ? desktopItems.filter(i => i.group === item.group).length : 0
    // Sin ítem activo, o con su sección plegada: no hay tarjeta.
    if (!item || (isAccordion(item.group, count) && closedGroups.has(item.group))) {
      setPill(p => (p.ready ? { ...p, ready: false } : p))
      return
    }
    const el = itemRefs.current[activeIndex]
    if (!el) return
    const top = el.offsetTop
    const height = el.offsetHeight
    setPill(p => (p.ready && p.top === top && p.height === height ? p : { top, height, ready: true }))
  }, [pathname, desktopItems, isAccordion, closedGroups])

  useEffect(() => {
    queueMicrotask(measurePill)
  }, [measurePill])

  // Mientras un acordeón se abre o cierra, los ítems de abajo se mueven: la tarjeta los sigue.
  useEffect(() => {
    const el = groupsRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measurePill())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measurePill])

  useEffect(() => {
    if (!moreOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [moreOpen])

  // Popover de la card del perfil: se cierra con Esc o clic afuera.
  useEffect(() => {
    if (!profileOpen) return
    // Esc cierra primero el submenú de links y después el popover.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (linksOpen) setLinksOpen(false)
      else setProfileOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [profileOpen, linksOpen])

  const copyLink = async (key: 'catalog' | 'tickets' | 'parking', url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
    } catch {
      setCopiedKey('error')
    }
    window.setTimeout(() => setCopiedKey(k => (k === key || k === 'error' ? null : k)), 1800)
  }

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
      <aside
        aria-label="Barra lateral"
        className={`hidden h-full min-h-0 shrink-0 flex-col bg-gray-100 pb-3 pt-4 transition-[width,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex ${
          collapsed ? 'w-[68px] px-2.5' : 'w-[264px] px-3'
        }`}
      >
        {/* Marca del organizador (o de nubapay) y botón para plegar. */}
        <div className={`mb-3 flex h-8 shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between gap-2 pl-2'}`}>
          {!collapsed && (
            brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL remota de marca configurada
              <img src={brandLogo} alt={brandName || ''} className="h-[22px] w-auto max-w-[170px] object-contain object-left" />
            ) : brandName ? (
              <span className="truncate text-[15px] font-semibold tracking-tight text-gray-900">{brandName}</span>
            ) : (
              <span className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático del símbolo */}
                <img src="/simbolo-nubapay.svg" alt="" aria-hidden width={17} height={14} className="h-[14px] w-auto" />
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático del logo */}
                <img src="/logo-nubapay.svg" alt="nubapay" width={66} height={22} className="h-[22px] w-auto" />
              </span>
            )
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'}
            title={collapsed ? 'Expandir  [' : 'Plegar  ['}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-gray-900"
          >
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.75} /> : <PanelLeftClose size={16} strokeWidth={1.75} />}
          </button>
        </div>

        {backLink && (
          <Link
            href={backLink.href}
            title={collapsed ? backLink.label : undefined}
            aria-label={collapsed ? backLink.label : undefined}
            className={`mb-2 flex h-9 shrink-0 items-center gap-2 rounded-[10px] text-[13px] font-semibold text-gray-600 transition-colors hover:bg-white/70 hover:text-gray-900 ${
              collapsed ? 'justify-center' : 'pl-[11px] pr-2'
            }`}
          >
            <ArrowLeft size={15} strokeWidth={2} aria-hidden />
            {!collapsed && <span className="truncate">{backLink.label}</span>}
          </Link>
        )}

        {/* Selector de evento: muestra el evento activo y lleva a la lista para cambiarlo. */}
        {(() => {
          const myEventsHref = switcher?.href ?? `${basePath}/mis-eventos`
          const myEventsActive = isRouteActive(pathname, myEventsHref)
          const hint = switcher?.hint ?? 'Cambiar de evento'
          return (
            <Link
              href={myEventsHref}
              title={collapsed ? `${title ?? 'Mis eventos'} · ${hint}` : hint}
              aria-label={collapsed ? `${title ?? 'Mis eventos'}, ${hint.toLowerCase()}` : undefined}
              className={`group mb-2 flex shrink-0 items-center gap-2.5 rounded-xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[border-color,box-shadow] hover:shadow-[0_2px_8px_-2px_rgba(16,24,40,0.12)] ${
                collapsed ? 'justify-center p-1.5' : 'p-2 pr-2.5'
              } ${myEventsActive ? 'border-gray-300' : 'border-gray-200/80 hover:border-gray-300'}`}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
                style={{ background: ORG_ACC, color: ORG_INK }}
                aria-hidden
              >
                {title ? title.trim().charAt(0).toUpperCase() : <LayoutGrid size={14} strokeWidth={2} />}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-gray-400">{switcher?.caption ?? (title ? 'Evento' : 'Organizer')}</span>
                    <span className="block truncate text-[13px] font-semibold text-gray-900">{title ?? 'Mis eventos'}</span>
                  </span>
                  <ChevronsUpDown
                    size={15}
                    strokeWidth={1.75}
                    className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-700"
                    aria-hidden
                  />
                </>
              )}
            </Link>
          )
        })()}

        {showSearch && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
          aria-label={collapsed ? 'Buscar y comandos' : undefined}
          title={collapsed ? 'Buscar  ⌘K' : undefined}
          className={`group mb-4 flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] text-[13px] text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-900 ${
            collapsed ? 'justify-center' : 'pl-[13px] pr-2'
          }`}
        >
          <Search size={15} strokeWidth={1.75} aria-hidden />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Buscar…</span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
        )}

        <nav
          ref={navRef}
          aria-label="Herramientas del evento"
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          {/* Indicador del ítem activo: tarjeta blanca que se desliza entre ítems. */}
          <div
            className="pointer-events-none absolute inset-x-0 rounded-[10px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_0_0_1px_rgba(16,24,40,0.04)]"
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.ready ? 1 : 0,
              transition: pill.ready
                ? 'top 240ms cubic-bezier(0.22,1,0.36,1), height 240ms cubic-bezier(0.22,1,0.36,1), opacity 150ms'
                : 'none',
            }}
            aria-hidden
          />

          <div ref={groupsRef}>
            {desktopGroups.map(({ group, groupItems }, groupIndex) => {
              const accordion = isAccordion(group.key, groupItems.length)
              const open = !accordion || !closedGroups.has(group.key)
              const panelId = `nav-group-${group.key}`
              const links = groupItems.map(({ item, index }) => {
                const active = isItemActive(pathname, item)
                return (
                  <div key={item.href} ref={el => { itemRefs.current[index] = el }}>
                    <Link
                      href={item.href}
                      data-tour={item.tourId}
                      aria-current={active ? 'page' : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`group/item relative z-10 flex h-9 items-center gap-2.5 rounded-[10px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-900 ${
                        collapsed ? 'justify-center' : 'pl-[7px] pr-2'
                      } ${active ? 'font-semibold text-gray-900' : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'}`}
                    >
                      {/* El ícono activo va sobre el color de marca: funciona con cualquier acento. */}
                      <span
                        className={`flex size-[22px] shrink-0 items-center justify-center rounded-md transition-colors [&_svg]:size-[15px] ${
                          active ? '' : 'text-gray-400 group-hover/item:text-gray-600'
                        }`}
                        style={active ? { background: ORG_ACC, color: ORG_INK } : undefined}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.shortcut && (
                        <span
                          className="flex gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
                          aria-hidden
                        >
                          <Kbd>G</Kbd>
                          <Kbd>{item.shortcut.toUpperCase()}</Kbd>
                        </span>
                      )}
                    </Link>
                  </div>
                )
              })

              // Barra plegada o sección de un solo ítem: sin encabezado, separada por una línea.
              if (!accordion) {
                return (
                  <div
                    key={group.key}
                    role="group"
                    aria-label={group.label}
                    className={groupIndex > 0 ? (collapsed ? 'mt-2 border-t border-gray-200/70 pt-2' : 'mt-3') : ''}
                  >
                    {showGroupTitles && !collapsed && (
                      <p className="flex h-7 items-center pl-[10px] text-[11px] font-semibold text-gray-400">{group.label}</p>
                    )}
                    {links}
                  </div>
                )
              }

              const hidesActive = !open && activeGroup === group.key
              return (
                <div key={group.key} className={groupIndex > 0 ? 'mt-3' : ''}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="group/head flex h-7 w-full items-center gap-1.5 rounded-lg pl-[10px] pr-2 text-[11px] font-semibold text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-900"
                  >
                    <span className="flex-1 text-left">{group.label}</span>
                    {/* Plegada con la herramienta actual adentro: un punto lo recuerda. */}
                    {hidesActive && (
                      <span className="size-1.5 rounded-full" style={{ background: ORG_ACC }} aria-hidden />
                    )}
                    {!open && <span className="tabular-nums text-gray-300" aria-hidden>{groupItems.length}</span>}
                    <ChevronDown
                      size={14}
                      strokeWidth={1.75}
                      className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90'}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                  >
                    <div id={panelId} role="group" aria-label={group.label} inert={!open} className="min-h-0 overflow-hidden">
                      {links}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        <div className="mt-2 flex shrink-0 flex-col gap-1">
          {/* Aviso para conectar un medio de pago: desaparece solo una vez conectado. */}
          <div
            className="overflow-hidden"
            style={{
              maxHeight: mpState === 'hidden' ? 0 : 80,
              opacity: mpState === 'hidden' ? 0 : 1,
              paddingBottom: mpState === 'hidden' ? 0 : 4,
              transition: mpState === 'hidden'
                ? 'max-height 0.6s ease, opacity 0.5s ease, padding-bottom 0.6s ease'
                : 'none',
            }}
          >
            <Link
              href={paymentsHref ?? `${basePath}/metodos-pago`}
              aria-label={collapsed ? (mpState === 'connected' ? 'Pagos conectados' : 'Conectar pagos') : undefined}
              title={collapsed ? (mpState === 'connected' ? 'Pagos conectados' : 'Conectar pagos') : undefined}
              className={`flex w-full items-center gap-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${
                collapsed ? 'h-9 justify-center' : 'px-3 py-2'
              } ${
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
                <Landmark size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
              )}
              {!collapsed && (
                <>
                  <span className="flex-1">{mpState === 'connected' ? 'Pagos conectados' : 'Conectar pagos'}</span>
                  {mpState !== 'connected' && <span className="text-[11px] font-semibold opacity-60" aria-hidden>→</span>}
                </>
              )}
            </Link>
          </div>

          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener"
              aria-label={collapsed ? 'Ver la tienda pública (pestaña nueva)' : undefined}
              title={collapsed ? 'Ver la tienda pública' : storeUrl}
              className={`group flex h-9 items-center gap-2.5 rounded-[10px] text-[13px] text-gray-600 transition-colors hover:bg-white/60 hover:text-gray-900 ${
                collapsed ? 'justify-center' : 'pl-[7px] pr-2'
              }`}
            >
              <span className="flex size-[22px] shrink-0 items-center justify-center text-gray-400 group-hover:text-gray-600">
                <Store size={15} strokeWidth={1.75} aria-hidden />
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">Ver tienda</span>
                  <ArrowUpRight size={13} className="text-gray-300 transition-colors group-hover:text-gray-500" aria-hidden />
                </>
              )}
            </a>
          )}
        </div>

        <div ref={profileRef} className="relative mt-2 shrink-0 border-t border-gray-200/80 pt-2">
          {profileOpen && (
            <div
              role="menu"
              aria-label="Menú de la cuenta"
              className={`absolute z-30 rounded-xl border border-gray-200/80 bg-white p-1 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.22),0_2px_6px_rgba(16,24,40,0.06)] ${
                collapsed ? 'bottom-0 left-full ml-2 w-64 origin-bottom-left' : 'bottom-full left-0 right-0 mb-1.5 origin-bottom'
              }`}
              style={{ animation: 'profile-pop 140ms cubic-bezier(0.22,1,0.36,1) backwards' }}
            >
              <style>{`
                @keyframes profile-pop {
                  from { opacity: 0; transform: translateY(4px) scale(0.98); }
                  to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                  [role="menu"] { animation: none !important; }
                }
              `}</style>
              {collapsed && emailLabel && (
                <p className="truncate px-2.5 pb-1.5 pt-1 text-[11px] text-gray-400" title={emailLabel}>{emailLabel}</p>
              )}
              {accountHref !== null && (
                <ProfileMenuLink href={accountHref ?? `${basePath}/cuenta`} onClick={() => setProfileOpen(false)} icon={<User size={15} strokeWidth={1.75} />}>
                  Mi cuenta
                </ProfileMenuLink>
              )}
              <ProfileMenuButton
                icon={<BookOpen size={15} strokeWidth={1.75} />}
                trailing={<ArrowUpRight size={13} className="text-gray-300" aria-hidden />}
                onClick={() => { setProfileOpen(false); window.open(docsUrl, '_blank', 'noopener') }}
              >
                Documentación
              </ProfileMenuButton>
              <ProfileMenuButton
                icon={<Keyboard size={15} strokeWidth={1.75} />}
                trailing={<Kbd>?</Kbd>}
                onClick={() => { setProfileOpen(false); window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT)) }}
              >
                Atajos de teclado
              </ProfileMenuButton>
              <ProfileMenuButton
                icon={<LifeBuoy size={15} strokeWidth={1.75} />}
                trailing={<ArrowUpRight size={13} className="text-gray-300" aria-hidden />}
                onClick={() => {
                  setProfileOpen(false)
                  // Centro de ayuda público, en otra pestaña (igual que la documentación) para no perder el panel.
                  window.open('/ayuda', '_blank', 'noopener')
                }}
              >
                Ayuda y soporte
              </ProfileMenuButton>

              {(catalogUrl || ticketsUrl || parkingUrl) && (
                <>
                  <div className="my-1 h-px bg-gray-100" aria-hidden />
                  {/* Links públicos: un solo ítem que abre un segundo popover para copiarlos. */}
                  <div className="relative">
                    <button
                      type="button"
                      role="menuitem"
                      aria-haspopup="menu"
                      aria-expanded={linksOpen}
                      onClick={() => setLinksOpen(o => !o)}
                      className={`${profileItemClass} ${linksOpen ? 'bg-gray-100 text-gray-900' : ''}`}
                    >
                      <span className="shrink-0 text-gray-400" aria-hidden><Link2 size={15} strokeWidth={1.75} /></span>
                      <span className="flex-1 truncate">Links públicos</span>
                      <ChevronRight
                        size={14}
                        strokeWidth={1.75}
                        className={`shrink-0 transition-colors ${linksOpen ? 'text-gray-700' : 'text-gray-300'}`}
                        aria-hidden
                      />
                    </button>
                    {linksOpen && (
                      <div
                        role="menu"
                        aria-label="Links públicos"
                        className="absolute bottom-0 left-full z-40 ml-2 w-72 origin-bottom-left rounded-xl border border-gray-200/80 bg-white p-1 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.22),0_2px_6px_rgba(16,24,40,0.06)]"
                        style={{ animation: 'profile-pop 140ms cubic-bezier(0.22,1,0.36,1) backwards' }}
                      >
                        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold text-gray-400">Tocá un link para copiarlo</p>
                        {([
                          { key: 'catalog', label: 'Catálogo', url: catalogUrl, icon: <Package size={15} strokeWidth={1.75} /> },
                          { key: 'tickets', label: 'Tickets', url: ticketsUrl, icon: <Ticket size={15} strokeWidth={1.75} /> },
                          { key: 'parking', label: 'Parking', url: parkingUrl, icon: <ParkingSquare size={15} strokeWidth={1.75} /> },
                        ] as const)
                          .filter(l => l.url)
                          .map(l => {
                            const copied = copiedKey === l.key
                            return (
                              <button
                                key={l.key}
                                type="button"
                                role="menuitem"
                                onClick={() => void copyLink(l.key, l.url)}
                                title={l.url}
                                className="group/link flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none"
                              >
                                <span className="shrink-0 text-gray-400" aria-hidden>{l.icon}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] text-gray-700 group-hover/link:text-gray-900">
                                    {copied ? 'Link copiado' : l.label}
                                  </span>
                                  <span className="block truncate text-[11px] text-gray-400">
                                    {l.url.replace(/^https?:\/\//, '')}
                                  </span>
                                </span>
                                {copied ? (
                                  <Check size={14} strokeWidth={2} className="shrink-0 text-green-600" aria-hidden />
                                ) : (
                                  <Copy size={14} strokeWidth={1.75} className="shrink-0 text-gray-300 transition-colors group-hover/link:text-gray-500" aria-hidden />
                                )}
                              </button>
                            )
                          })}
                        {copiedKey === 'error' && (
                          <p className="px-2.5 pb-1 text-[11px] text-red-600">No se pudo copiar el link.</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="my-1 h-px bg-gray-100" aria-hidden />
              <ProfileMenuButton
                icon={<LogOut size={15} strokeWidth={1.75} />}
                onClick={() => { setProfileOpen(false); onLogout() }}
              >
                Cerrar sesión
              </ProfileMenuButton>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setLinksOpen(false); setProfileOpen(o => !o) }}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label={collapsed ? `Cuenta: ${emailLabel}` : undefined}
            title={collapsed ? emailLabel : undefined}
            className={`group flex w-full items-center gap-2.5 rounded-[10px] text-left transition-colors ${
              collapsed ? 'justify-center p-1.5' : 'p-1.5 pr-2'
            } bg-[#fff] shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${profileOpen ? 'ring-1 ring-gray-200' : 'hover:shadow-[0_2px_8px_-2px_rgba(16,24,40,0.12)]'}`}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold uppercase text-white"
              aria-hidden
            >
              {emailLabel ? emailLabel.charAt(0) : '·'}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-gray-700 group-hover:text-gray-900" title={emailLabel}>
                    {emailLabel || '…'}
                  </span>
                  <span className="block text-[11px] text-gray-400">
                    {workspaceMembership === 'owner' ? 'Dueño del evento' : 'Equipo'}
                  </span>
                </span>
                <ChevronsUpDown
                  size={15}
                  strokeWidth={1.75}
                  className={`shrink-0 transition-colors ${profileOpen ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-700'}`}
                  aria-hidden
                />
              </>
            )}
          </button>
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
        <div className="flex w-full items-end justify-center min-h-[68px] overflow-visible px-1 pt-1">
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
                      <span
                        className="relative flex size-[60px] shrink-0 items-center justify-center rounded-full [&_svg]:size-6 border-4 shadow-lg transition-transform active:scale-95"
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
                  className="flex min-w-0 flex-1 max-w-[5.5rem] flex-col items-center justify-center py-3 min-h-[64px]"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                  aria-label="Ver más herramientas"
                >
                  <span className="relative flex items-center justify-center">
                    <span
                      className="flex items-center justify-center rounded-full transition-all duration-150 [&_svg]:size-5"
                      style={
                        moreOverflowActive
                          ? { background: `color-mix(in srgb, ${ORG_ACC} 18%, transparent)`, width: 48, height: 32, color: ORG_INK }
                          : { width: 48, height: 32, color: '#9CA3AF' }
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
                </button>
              )
            }

            const active = isItemActive(pathname, slot.item)
            return (
              <Link
                key={slot.item.href}
                href={slot.item.href}
                aria-label={slot.item.label}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-0 flex-1 max-w-[5.5rem] flex-col items-center justify-center py-3 min-h-[64px]"
                onClick={() => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8) }}
              >
                <span
                  className="flex items-center justify-center rounded-full transition-all duration-150 [&_svg]:size-5"
                  style={
                    active
                      ? { background: `color-mix(in srgb, ${ORG_ACC} 18%, transparent)`, width: 48, height: 32, color: ORG_INK }
                      : { width: 48, height: 32, color: '#9CA3AF' }
                  }
                >
                  {slot.item.icon}
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
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                Cerrar
              </button>
            </div>
            <nav className="overflow-y-auto px-2 py-2">
              <ul className="flex flex-col gap-0.5">
                {backLink && (
                  <li className="mb-1 border-b border-gray-100 pb-1">
                    <Link
                      href={backLink.href}
                      onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <span className="text-gray-400"><ArrowLeft size={16} strokeWidth={2} aria-hidden /></span>
                      {backLink.label}
                    </Link>
                  </li>
                )}
                {items.map(item => {
                  const active = isItemActive(pathname, item)
                  return (
                    <li key={`more-${item.href}`}>
                      <Link
                        href={item.href}
                        onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                          active ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={active ? 'text-gray-900' : 'text-gray-400'}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
                <li className="mt-1 border-t border-gray-100 pt-1">
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener"
                    onClick={() => { setMoreOpen(false); setSheetDragY(0) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="text-gray-400">
                      <BookOpen size={16} strokeWidth={1.75} aria-hidden />
                    </span>
                    Documentación
                    <ArrowUpRight size={14} className="ml-auto text-gray-300" aria-hidden />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 font-sans text-[10px] font-semibold text-gray-400">
      {children}
    </kbd>
  )
}

const profileItemClass =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:bg-gray-100 focus-visible:outline-none'

function ProfileMenuButton({
  icon,
  trailing,
  onClick,
  title,
  children,
}: {
  icon: React.ReactNode
  trailing?: React.ReactNode
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button type="button" role="menuitem" onClick={onClick} title={title} className={profileItemClass}>
      <span className="shrink-0 text-gray-400" aria-hidden>{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {trailing}
    </button>
  )
}

function ProfileMenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string
  icon: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link href={href} role="menuitem" onClick={onClick} className={profileItemClass}>
      <span className="shrink-0 text-gray-400" aria-hidden>{icon}</span>
      <span className="flex-1 truncate">{children}</span>
    </Link>
  )
}
