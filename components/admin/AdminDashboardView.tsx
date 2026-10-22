'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { EventDrawer } from './EventDrawer'
import { EventsTab } from './EventsTab'
import { GlobalSearch, type SearchTarget } from './GlobalSearch'
import { HealthTab } from './HealthTab'
import { OrderDrawer } from './OrderDrawer'
import { OrdersTab } from './OrdersTab'
import { OverviewTab } from './OverviewTab'
import { PaymentsStrip } from './PaymentsStrip'
import { SettlementTab } from './SettlementTab'
import { UsersTab } from './UsersTab'
import { ToastProvider, cx } from './ui'
import { LoadTestsView } from '@/components/admin/LoadTestsView'
import { Spinner } from '@/components/ui/Spinner'
import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import { fetchPlatformHealth, fetchPlatformOverview, type PlatformAdminOverview } from '@/lib/platformAdmin'

const TABS = [
  { key: 'overview', label: 'Resumen' },
  { key: 'health', label: 'Salud' },
  { key: 'orders', label: 'Órdenes' },
  { key: 'events', label: 'Eventos' },
  { key: 'users', label: 'Usuarios' },
  { key: 'settlement', label: 'Liquidación' },
  { key: 'load-tests', label: 'Load tests' },
] as const

type TabKey = (typeof TABS)[number]['key']

const isTab = (v: string): v is TabKey => TABS.some((t) => t.key === v)

const HEALTH_BADGE_MS = 60_000

async function fetchAlertSummary(): Promise<{ total: number; critical: boolean } | null> {
  const r = await fetchPlatformHealth()
  return r.ok ? { total: r.data.alerts.length, critical: r.data.alerts.some((a) => a.level === 'critical') } : null
}

function Dashboard({ summary }: { summary: PlatformAdminOverview['summary'] }) {
  const router = useRouter()
  // Dashboard se monta recién tras cargar datos en el cliente, así que `window` ya existe.
  const [tab, setTabState] = useState<TabKey>(() => {
    const h = window.location.hash.replace('#', '')
    return isTab(h) ? h : 'overview'
  })
  // Las pestañas ya visitadas quedan montadas (ocultas) para conservar filtros y página.
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['overview', tab]))

  const [orderId, setOrderId] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [ordersQuery, setOrdersQuery] = useState<string | undefined>()
  const [ordersEventId, setOrdersEventId] = useState<string | undefined>()
  const [usersQuery, setUsersQuery] = useState<string | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [alertCount, setAlertCount] = useState<{ total: number; critical: boolean }>({ total: 0, critical: false })

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

  // Badge de alertas en la pestaña Salud (la pestaña tiene su propio refresco detallado).
  const refreshBadge = useCallback(async () => {
    const s = await fetchAlertSummary()
    if (s) setAlertCount(s)
  }, [])
  useEffect(() => {
    let alive = true
    const run = async () => {
      const s = await fetchAlertSummary()
      if (alive && s) setAlertCount(s)
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
    else if (t.type === 'event') setEventId(t.id)
    else {
      setUsersQuery(t.email)
      setTab('users')
    }
  }

  function viewEventOrders(id: string) {
    setEventId(null)
    setOrdersQuery('')
    setOrdersEventId(id)
    setTab('orders')
  }

  const onDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
    refreshBadge()
  }, [refreshBadge])

  const user = getAuthUser()
  const show = (k: TabKey) => tab === k
  const mounted = (k: TabKey) => visited.has(k)

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <header className="border-b border-white/[0.08] bg-[#12121A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C6FF00]">Nubapay</p>
            <h1 className="text-lg font-semibold leading-tight">Admin de plataforma</h1>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-left text-sm text-white/40 transition-colors hover:border-white/20 hover:bg-white/[0.06] md:flex"
          >
            <Search size={15} />
            <span className="flex-1">Buscar orden, email, evento, usuario…</span>
            <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">⌘K</kbd>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5 md:hidden"
            >
              <Search size={16} />
            </button>
            {user ? <span className="hidden text-sm text-white/45 lg:inline">{user.email}</span> : null}
            <button
              type="button"
              onClick={() => {
                clearAuthSession()
                router.replace('/login')
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <PaymentsStrip onChanged={onDataChanged} />

      <nav className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0A0A0F]/90 backdrop-blur" aria-label="Secciones">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={cx(
                'flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === t.key ? 'border-[#C6FF00] text-white' : 'border-transparent text-white/45 hover:text-white/80',
              )}
            >
              {t.label}
              {t.key === 'health' && alertCount.total > 0 && (
                <span
                  className={cx(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                    alertCount.critical ? 'bg-red-500 text-white' : 'bg-amber-400 text-black',
                  )}
                  aria-label={`${alertCount.total} alertas`}
                >
                  {alertCount.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-7 md:px-6">
        {mounted('overview') && (
          <div hidden={!show('overview')}>
            <OverviewTab summary={summary} />
          </div>
        )}
        {show('health') && <HealthTab onOpenOrder={setOrderId} />}
        {mounted('orders') && (
          <div hidden={!show('orders')}>
            <OrdersTab key={`${ordersQuery ?? ''}|${ordersEventId ?? ''}`} initialQuery={ordersQuery} initialEventId={ordersEventId} onOpenOrder={setOrderId} refreshKey={refreshKey} />
          </div>
        )}
        {mounted('events') && (
          <div hidden={!show('events')}>
            <EventsTab onOpenEvent={setEventId} refreshKey={refreshKey} />
          </div>
        )}
        {mounted('users') && (
          <div hidden={!show('users')}>
            <UsersTab key={usersQuery ?? ''} initialQuery={usersQuery} />
          </div>
        )}
        {mounted('settlement') && (
          <div hidden={!show('settlement')}>
            <SettlementTab />
          </div>
        )}
        {show('load-tests') && <LoadTestsView />}
      </main>

      <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} onChanged={onDataChanged} />
      <EventDrawer eventId={eventId} onClose={() => setEventId(null)} onViewOrders={viewEventOrders} onChanged={onDataChanged} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
    </div>
  )
}

export function AdminDashboardView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<PlatformAdminOverview['summary'] | null>(null)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetchPlatformOverview()
    if (r.ok) {
      setSummary(r.data.summary)
      setError('')
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0F] px-4 text-center">
        <p className="text-red-300">{error || 'No se pudo cargar el panel'}</p>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
            Reintentar
          </button>
          <button type="button" onClick={() => router.replace('/login')} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <Dashboard summary={summary} />
    </ToastProvider>
  )
}
