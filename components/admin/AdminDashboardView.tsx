'use client'

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Receipt,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { EventPanel } from './EventPanel'
import { EventsTab } from './EventsTab'
import { GlobalSearch, type SearchTarget } from './GlobalSearch'
import { HealthTab } from './HealthTab'
import { OrderDrawer } from './OrderDrawer'
import { OrdersTab } from './OrdersTab'
import { OverviewTab } from './OverviewTab'
import { PaymentsStrip, type PaymentsState } from './PaymentsStrip'
import { SettlementTab } from './SettlementTab'
import { UsersTab } from './UsersTab'
import { ToastProvider, cx, useAsync } from './ui'
import { LoadTestsView } from '@/components/admin/LoadTestsView'
import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import { fetchPlatformHealth, fetchPlatformOverview } from '@/lib/platformAdmin'

const NAV_GROUPS = [
  {
    label: 'Operación',
    items: [
      { key: 'overview', label: 'Resumen', hint: 'Facturación y actividad de la plataforma', icon: LayoutDashboard },
      { key: 'health', label: 'Salud', hint: 'Servicios, colas y órdenes con problemas', icon: Activity },
      { key: 'orders', label: 'Órdenes', hint: 'Todas las órdenes de todos los eventos', icon: Receipt },
      { key: 'events', label: 'Eventos', hint: 'Estado de ventas y facturación por evento', icon: CalendarDays },
    ],
  },
  {
    label: 'Plataforma',
    items: [
      { key: 'users', label: 'Usuarios', hint: 'Cuentas registradas', icon: Users },
      { key: 'settlement', label: 'Liquidación', hint: 'Lo que corresponde cobrar a cada organizador', icon: Landmark },
      { key: 'load-tests', label: 'Load tests', hint: 'Pruebas de carga contra un evento', icon: Gauge },
    ],
  },
] as const satisfies readonly {
  label: string
  items: readonly { key: string; label: string; hint: string; icon: LucideIcon }[]
}[]

const TABS = NAV_GROUPS.flatMap((g) => [...g.items])

/** Accesos fijos de la barra inferior en celular; el resto se abre desde "Más". */
const BAR_ITEMS = NAV_GROUPS[0].items

type TabKey = (typeof TABS)[number]['key']

const isTab = (v: string): v is TabKey => TABS.some((t) => t.key === v)

const HEALTH_BADGE_MS = 60_000

/** Medidas del menú lateral: de acá sale la posición del indicador que se desliza. */
const NAV_ITEM_PX = 36
const NAV_GAP_PX = 2
const NAV_LABEL_PX = 28
const NAV_GROUP_GAP_PX = 14

function navOffset(tab: TabKey): number {
  let top = 0
  for (const group of NAV_GROUPS) {
    top += NAV_LABEL_PX
    for (const item of group.items) {
      if (item.key === tab) return top
      top += NAV_ITEM_PX + NAV_GAP_PX
    }
    top += NAV_GROUP_GAP_PX - NAV_GAP_PX
  }
  return top
}

type AlertSummary = { total: number; critical: boolean }

async function fetchAlertSummary(): Promise<AlertSummary | null> {
  const r = await fetchPlatformHealth()
  return r.ok ? { total: r.data.alerts.length, critical: r.data.alerts.some((a) => a.level === 'critical') } : null
}

/** `undefined` = primera revisión en curso; `null` = no se pudo consultar. */
function SystemStatus({ alerts, onOpen }: { alerts: AlertSummary | null | undefined; onOpen: () => void }) {
  const tone =
    alerts === undefined || alerts === null
      ? 'text-white/40'
      : alerts.critical
        ? 'text-red-400'
        : alerts.total > 0
          ? 'text-amber-400'
          : 'text-emerald-400'
  const label =
    alerts === undefined
      ? 'Revisando…'
      : alerts === null
        ? 'Sin datos de salud'
        : alerts.total === 0
          ? 'Todo operativo'
          : alerts.total === 1
            ? '1 alerta activa'
            : `${alerts.total} alertas activas`
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-white/75 transition-colors duration-150 hover:bg-white/[0.05]"
    >
      <span className={cx('h-2 w-2 flex-shrink-0 rounded-full bg-current', alerts ? 'admin-ping' : '', tone)} aria-hidden />
      {label}
    </button>
  )
}

function Dashboard() {
  const router = useRouter()
  // Va aparte del armado del panel: si esto falla, el interruptor de pagos y Salud siguen disponibles.
  const overview = useAsync(fetchPlatformOverview, [])
  // Dashboard se monta recién tras cargar datos en el cliente, así que `window` ya existe.
  const [tab, setTabState] = useState<TabKey>(() => {
    const h = window.location.hash.replace('#', '')
    return isTab(h) ? h : 'overview'
  })
  // Las pestañas ya visitadas quedan montadas (ocultas) para conservar filtros y página.
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['overview', tab]))

  const [orderId, setOrderId] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [usersQuery, setUsersQuery] = useState<string | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertSummary | null | undefined>(undefined)
  const [payments, setPayments] = useState<PaymentsState>({ enabled: null, effective: null })
  const [navOpen, setNavOpen] = useState(false)
  const sheetRef = useRef<HTMLElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)

  const setTab = useCallback((next: TabKey) => {
    setTabState(next)
    setVisited((v) => (v.has(next) ? v : new Set(v).add(next)))
    try {
      window.history.replaceState(null, '', `#${next}`)
    } catch {
      /* historial no disponible: la pestaña igual cambia */
    }
  }, [])

  // Cmd/Ctrl+K abre la búsqueda global.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Con "Más" abierto: Esc cierra, el fondo no scrollea y el foco vuelve al botón al salir.
  useEffect(() => {
    if (!navOpen) return
    const moreButton = moreRef.current
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      moreButton?.focus()
    }
  }, [navOpen])

  // Badge de alertas en la pestaña Salud (la pestaña tiene su propio refresco detallado).
  const refreshBadge = useCallback(async () => {
    setAlerts(await fetchAlertSummary())
  }, [])
  useEffect(() => {
    let alive = true
    const run = async () => {
      const s = await fetchAlertSummary()
      if (alive) setAlerts(s)
    }
    run()
    const t = setInterval(() => document.visibilityState === 'visible' && run(), HEALTH_BADGE_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  function handleSelect(t: SearchTarget) {
    if (t.type === 'order') setOrderId(t.id)
    else if (t.type === 'event') openEvent(t.id)
    else {
      setUsersQuery(t.email)
      setTab('users')
    }
  }

  function openEvent(id: string) {
    setEventId(id)
    setTab('events')
    window.scrollTo({ top: 0 })
  }

  const onDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
    refreshBadge()
  }, [refreshBadge])

  const user = getAuthUser()
  const show = (k: TabKey) => tab === k
  const mounted = (k: TabKey) => visited.has(k)

  const current = TABS.find((t) => t.key === tab) ?? TABS[0]
  const barIndex = BAR_ITEMS.findIndex((t) => t.key === tab)
  const moreActive = navOpen || barIndex === -1

  function go(next: TabKey) {
    setEventId(null)
    setTab(next)
    setNavOpen(false)
  }

  return (
    <div id="admin-root" className="min-h-screen bg-admin-canvas text-white lg:pl-60">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(55%_100%_at_60%_0%,rgba(0,105,255,0.09),transparent)]"
      />

      {/* Un solo menú: pantalla "Más" en celular (termina arriba de la barra inferior) y barra lateral desde lg. */}
      <aside
        ref={sheetRef}
        tabIndex={-1}
        aria-label="Todas las herramientas"
        className={cx(
          'fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] top-0 z-40 flex flex-col overflow-y-auto bg-admin-canvas outline-none duration-150 ease-out',
          'lg:visible lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-60 lg:translate-y-0 lg:overflow-visible lg:border-r lg:border-white/[0.07] lg:bg-admin-surface lg:opacity-100',
          // `visibility` se anima solo al cerrar: al abrir tiene que ser inmediata para poder recibir el foco.
          navOpen ? 'translate-y-0 opacity-100 transition-[transform,opacity]' : 'invisible translate-y-2 opacity-0 transition-[transform,opacity,visibility]',
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
          <p className="text-sm font-semibold lg:hidden">Todas las herramientas</p>
          <p className="hidden text-[15px] font-semibold tracking-tight text-admin-brand lg:block">
            Nubapay <span className="ml-1 font-admin-mono text-[10.5px] font-normal uppercase tracking-[0.08em] text-white/45">admin</span>
          </p>
        </div>

        <nav className="relative flex-shrink-0 px-3 py-2 lg:min-h-0 lg:flex-1 lg:flex-shrink lg:overflow-y-auto lg:py-3" aria-label="Secciones">
          <div className="relative">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 hidden rounded-md bg-white/[0.07] transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:block"
              style={{ height: NAV_ITEM_PX, transform: `translateY(${navOffset(tab)}px)` }}
            >
              <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-admin-primary" />
            </span>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} style={{ marginBottom: NAV_GROUP_GAP_PX }}>
                <p
                  className="flex items-center px-2.5 font-admin-mono text-[10.5px] uppercase tracking-[0.08em] text-white/35"
                  style={{ height: NAV_LABEL_PX }}
                >
                  {group.label}
                </p>
                <ul className="grid grid-cols-2 gap-1.5 lg:flex lg:flex-col lg:gap-0.5">
                  {group.items.map((t) => (
                    <li key={t.key}>
                      <button
                        type="button"
                        onClick={() => go(t.key)}
                        aria-current={tab === t.key ? 'page' : undefined}
                        className={cx(
                          'relative flex h-[72px] w-full flex-col items-start justify-center gap-2 rounded-lg border border-white/[0.07] bg-admin-surface px-3 text-sm font-medium transition-colors duration-150',
                          'lg:h-9 lg:flex-row lg:items-center lg:justify-start lg:gap-2.5 lg:rounded-md lg:border-0 lg:bg-transparent lg:px-2.5 lg:text-[13px]',
                          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-accent',
                          tab === t.key ? 'border-admin-primary/50 text-white lg:bg-transparent' : 'text-white/70 hover:bg-white/[0.04] hover:text-white/90 lg:text-white/60',
                        )}
                      >
                        <t.icon size={15} aria-hidden className={tab === t.key ? 'text-admin-accent' : 'text-white/45'} />
                        <span className="text-left lg:flex-1">{t.label}</span>
                        {t.key === 'health' && !!alerts?.total && (
                          <span
                            className={cx(
                              'absolute right-2.5 top-2.5 rounded-full px-1.5 py-0.5 font-admin-mono text-[10px] font-medium leading-none lg:static',
                              alerts.critical ? 'bg-red-500 text-white' : 'bg-amber-400 text-black',
                            )}
                            aria-label={`${alerts.total} alertas`}
                          >
                            {alerts.total}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-auto flex-shrink-0 space-y-2 border-t border-white/[0.07] p-3">
          <SystemStatus alerts={alerts} onOpen={() => go('health')} />
          <PaymentsStrip onChanged={onDataChanged} onState={setPayments} />
          {/* En celular Salir va a la izquierda: a la derecha quedaría bajo el dedo que tocó "Más". */}
          <div className="flex flex-row-reverse items-center justify-between gap-2 px-1 pt-1 lg:flex-row">
            <span className="min-w-0 truncate text-xs text-white/50">{user?.email}</span>
            <button
              type="button"
              onClick={() => {
                clearAuthSession()
                router.replace('/login')
              }}
              aria-label="Salir"
              title="Salir"
              className="flex-shrink-0 rounded-md p-1.5 text-white/50 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-admin-canvas/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 md:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-tight">
              {eventId ? (
                <>
                  <span className="font-normal text-white/50">Eventos /</span> Detalle
                </>
              ) : (
                current.label
              )}
            </h1>
            <p className="hidden truncate text-xs text-white/50 sm:block">{eventId ? 'Métricas y controles del evento' : current.hint}</p>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-72 flex-shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-left text-[13px] text-white/50 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.05] md:flex"
          >
            <Search size={14} />
            <span className="flex-1 truncate">Buscar orden, email, evento…</span>
            <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-admin-mono text-[10px] text-white/50">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="rounded-md border border-white/10 p-2 text-white/70 hover:bg-white/5 md:hidden"
          >
            <Search size={15} />
          </button>
        </div>
        {payments.enabled === false ? (
          <p role="status" className="flex items-center gap-2 border-t border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-200 md:px-8">
            <AlertTriangle size={13} /> Pagos inhabilitados en toda la plataforma: nadie puede comprar.
          </p>
        ) : payments.enabled && payments.effective === false ? (
          <p role="status" className="flex items-center gap-2 border-t border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 md:px-8">
            <AlertTriangle size={13} /> Pagos guardados como habilitados, pero el servidor los reporta inhabilitados. Revisá Redis en Salud.
          </p>
        ) : null}
      </header>

      <main className="relative mx-auto max-w-[1360px] px-4 pb-24 pt-6 md:px-8 lg:pb-6">
        {eventId && (
          <div className="admin-rise">
            <EventPanel
              key={eventId}
              eventId={eventId}
              refreshKey={refreshKey}
              onBack={() => setEventId(null)}
              onOpenOrder={setOrderId}
              onChanged={onDataChanged}
            />
          </div>
        )}
        {mounted('overview') && (
          <div hidden={!show('overview') || !!eventId} className="admin-rise">
            <OverviewTab summary={overview.data?.summary ?? null} summaryError={overview.error} onRetrySummary={overview.reload} />
          </div>
        )}
        {show('health') && !eventId && (
          <div className="admin-rise">
            <HealthTab onOpenOrder={setOrderId} />
          </div>
        )}
        {mounted('orders') && (
          <div hidden={!show('orders') || !!eventId} className="admin-rise">
            <OrdersTab onOpenOrder={setOrderId} refreshKey={refreshKey} />
          </div>
        )}
        {mounted('events') && (
          <div hidden={!show('events') || !!eventId} className="admin-rise">
            <EventsTab onOpenEvent={openEvent} refreshKey={refreshKey} />
          </div>
        )}
        {mounted('users') && (
          <div hidden={!show('users') || !!eventId} className="admin-rise">
            <UsersTab key={usersQuery ?? ''} initialQuery={usersQuery} />
          </div>
        )}
        {mounted('settlement') && (
          <div hidden={!show('settlement') || !!eventId} className="admin-rise">
            <SettlementTab />
          </div>
        )}
        {show('load-tests') && !eventId && (
          <div className="admin-rise">
            <LoadTestsView />
          </div>
        )}
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-admin-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="relative grid grid-cols-5">
          <span
            aria-hidden
            className="absolute left-0 top-0 h-0.5 w-1/5 transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ transform: `translateX(${(moreActive ? BAR_ITEMS.length : barIndex) * 100}%)` }}
          >
            <span className="mx-auto block h-full w-8 rounded-full bg-admin-primary" />
          </span>
          {BAR_ITEMS.map((t) => {
            const on = tab === t.key && !navOpen
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => go(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
                className={cx(
                  'relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-accent',
                  on ? 'text-white' : 'text-white/55',
                )}
              >
                <span className="relative">
                  <t.icon size={19} aria-hidden className={on ? 'text-admin-accent' : undefined} />
                  {t.key === 'health' && !!alerts?.total && (
                    <span
                      className={cx(
                        'absolute -right-2.5 -top-1.5 min-w-4 rounded-full px-1 py-0.5 text-center font-admin-mono text-[9px] font-medium leading-none',
                        alerts.critical ? 'bg-red-500 text-white' : 'bg-amber-400 text-black',
                      )}
                      aria-label={`${alerts.total} alertas`}
                    >
                      {alerts.total}
                    </span>
                  )}
                </span>
                {t.label}
              </button>
            )
          })}
          <button
            ref={moreRef}
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            aria-expanded={navOpen}
            className={cx(
              'relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-accent',
              moreActive ? 'text-white' : 'text-white/55',
            )}
          >
            <MoreHorizontal size={19} aria-hidden className={moreActive ? 'text-admin-accent' : undefined} />
            Más
          </button>
        </div>
      </nav>

      <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} onChanged={onDataChanged} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
    </div>
  )
}

export function AdminDashboardView() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  )
}
