'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { LoadTestsView } from '@/components/admin/LoadTestsView'
import { Spinner } from '@/components/ui/Spinner'
import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import {
  fetchPlatformEvents,
  fetchPlatformOrders,
  fetchPlatformOverview,
  fetchPlatformRevenueByEvent,
  fetchPlatformUpcomingEvents,
  fetchPlatformUsers,
  PLATFORM_ADMIN_PAGE_SIZE,
  type PlatformAdminEvent,
  type PlatformAdminOrder,
  type PlatformAdminOverview,
  type PlatformAdminUser,
  type PlatformPagination,
  type PlatformRevenueByEvent,
} from '@/lib/platformAdmin'
import { formatDate, formatPrice } from '@/lib/utils'

const PAGE_SIZE = PLATFORM_ADMIN_PAGE_SIZE

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121A] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-white/50">{description}</p> : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12121A]">
        {children}
      </div>
    </section>
  )
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-white/40">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-white/80">{children}</td>
}

function AdminPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
      <p className="text-xs text-white/40">
        Página {safePage} de {totalPages} · {total} registros
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

function PaginatedSection<T>({
  title,
  description,
  page,
  pagination,
  loading,
  error,
  onPageChange,
  emptyMessage,
  children,
}: {
  title: string
  description?: string
  page: number
  pagination: PlatformPagination | null
  loading: boolean
  error: string
  onPageChange: (page: number) => void
  emptyMessage: string
  children: React.ReactNode
}) {
  return (
    <Section title={title} description={description}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-white/60" />
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-sm text-red-300">{error}</p>
      ) : pagination?.total === 0 ? (
        <p className="px-4 py-8 text-sm text-white/40">{emptyMessage}</p>
      ) : (
        <>
          {children}
          {pagination ? (
            <AdminPagination
              page={page}
              total={pagination.total}
              pageSize={pagination.page_size}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      )}
    </Section>
  )
}

function UsersTable({ users }: { users: PlatformAdminUser[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Nombre</Th>
            <Th>Email</Th>
            <Th>Rol</Th>
            <Th>Tenant</Th>
            <Th>Alta</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id}>
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>{u.tenant_subdomain ?? '—'}</Td>
              <Td>{u.created_at ? formatDate(u.created_at) : '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function EventsTable({ events }: { events: PlatformAdminEvent[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[880px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Evento</Th>
            <Th>Estado</Th>
            <Th>Fecha</Th>
            <Th>Organizador</Th>
            <Th>Órdenes</Th>
            <Th>Facturado</Th>
            <Th>Comisión (1%)</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.map((e) => (
            <tr key={e.id}>
              <Td>{e.name}</Td>
              <Td>{e.status}</Td>
              <Td>{e.starts_at ? formatDate(e.starts_at) : '—'}</Td>
              <Td>{e.organizer?.email ?? '—'}</Td>
              <Td>{e.stats.order_count}</Td>
              <Td>{formatPrice(e.stats.total_revenue)}</Td>
              <Td>{formatPrice(e.stats.commission_amount)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function OrdersTable({ orders }: { orders: PlatformAdminOrder[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>#</Th>
            <Th>Evento</Th>
            <Th>Cliente</Th>
            <Th>Estado</Th>
            <Th>Pago</Th>
            <Th>Total</Th>
            <Th>Fecha</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((o) => (
            <tr key={o.id}>
              <Td>{o.order_number ?? '—'}</Td>
              <Td>{o.event_name ?? '—'}</Td>
              <Td>{o.customer_name ?? o.customer_email ?? '—'}</Td>
              <Td>{o.status}</Td>
              <Td>{o.payment_status}</Td>
              <Td>{formatPrice(o.total_amount, o.currency)}</Td>
              <Td>{o.created_at ? formatDate(o.created_at) : '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function RevenueTable({ rows }: { rows: PlatformRevenueByEvent[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[800px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Evento</Th>
            <Th>Fecha evento</Th>
            <Th>Tenant</Th>
            <Th>Órdenes</Th>
            <Th>Monto facturado</Th>
            <Th>A cobrar (1%)</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.event_id}>
              <Td>{r.event_name}</Td>
              <Td>{r.starts_at ? formatDate(r.starts_at) : '—'}</Td>
              <Td>{r.tenant_subdomain ?? '—'}</Td>
              <Td>{r.order_count}</Td>
              <Td>{formatPrice(r.total_revenue)}</Td>
              <Td>{formatPrice(r.commission_amount)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function UpcomingTable({ events }: { events: PlatformAdminEvent[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Evento</Th>
            <Th>Fecha inicio</Th>
            <Th>Fecha fin</Th>
            <Th>Estado</Th>
            <Th>Organizador</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.map((e) => (
            <tr key={e.id}>
              <Td>{e.name}</Td>
              <Td>{e.starts_at ? formatDate(e.starts_at) : '—'}</Td>
              <Td>{e.ends_at ? formatDate(e.ends_at) : '—'}</Td>
              <Td>{e.status}</Td>
              <Td>{e.organizer?.email ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function usePaginatedFetch<T>(
  fetcher: (page: number, pageSize: number) => Promise<
    | { ok: true; data: T & { pagination: PlatformPagination } }
    | { ok: false; error: string }
  >,
  page: number,
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<T | null>(null)
  const [pagination, setPagination] = useState<PlatformPagination | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      const result = await fetcher(page, PAGE_SIZE)
      if (cancelled) return
      if (!result.ok) {
        setError(result.error)
        setData(null)
        setPagination(null)
      } else {
        const { pagination: p, ...rest } = result.data
        setData(rest as T)
        setPagination(p)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetcher, page])

  return { loading, error, data, pagination }
}

const TABS = [
  { key: 'overview' as const, label: 'Resumen' },
  { key: 'load-tests' as const, label: 'Load tests' },
]

export function AdminDashboardView() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('overview')
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')
  const [summary, setSummary] = useState<PlatformAdminOverview['summary'] | null>(null)

  const [usersPage, setUsersPage] = useState(1)
  const [eventsPage, setEventsPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const [revenuePage, setRevenuePage] = useState(1)
  const [upcomingPage, setUpcomingPage] = useState(1)

  const fetchUsers = useCallback(
    (page: number, pageSize: number) => fetchPlatformUsers(page, pageSize),
    [],
  )
  const fetchEvents = useCallback(
    (page: number, pageSize: number) => fetchPlatformEvents(page, pageSize),
    [],
  )
  const fetchOrders = useCallback(
    (page: number, pageSize: number) => fetchPlatformOrders(page, pageSize),
    [],
  )
  const fetchRevenue = useCallback(
    (page: number, pageSize: number) => fetchPlatformRevenueByEvent(page, pageSize),
    [],
  )
  const fetchUpcoming = useCallback(
    (page: number, pageSize: number) => fetchPlatformUpcomingEvents(page, pageSize),
    [],
  )

  const users = usePaginatedFetch<{ users: PlatformAdminUser[] }>(fetchUsers, usersPage)
  const events = usePaginatedFetch<{ events: PlatformAdminEvent[] }>(fetchEvents, eventsPage)
  const orders = usePaginatedFetch<{ orders: PlatformAdminOrder[] }>(fetchOrders, ordersPage)
  const revenue = usePaginatedFetch<{ revenue_by_event: PlatformRevenueByEvent[] }>(
    fetchRevenue,
    revenuePage,
  )
  const upcoming = usePaginatedFetch<{ events: PlatformAdminEvent[] }>(fetchUpcoming, upcomingPage)

  useEffect(() => {
    ;(async () => {
      const result = await fetchPlatformOverview()
      if (!result.ok) {
        setSummaryError(result.error)
      } else {
        setSummary(result.data.summary)
      }
      setSummaryLoading(false)
    })()
  }, [])

  function handleLogout() {
    clearAuthSession()
    router.replace('/login')
  }

  const user = getAuthUser()

  if (summaryLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  if (summaryError || !summary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0F] px-4 text-center">
        <p className="text-red-300">{summaryError || 'No se pudo cargar el panel'}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <header className="border-b border-white/10 bg-[#12121A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#C6FF00]">Nubapay</p>
            <h1 className="text-xl font-semibold">Admin de plataforma</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? <span className="hidden text-sm text-white/50 sm:inline">{user.email}</span> : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/10 bg-[#0A0A0F]">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 md:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-[#C6FF00] text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        {activeTab === 'load-tests' ? (
          <LoadTestsView />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard label="Usuarios" value={String(summary.total_users)} />
              <SummaryCard label="Eventos" value={String(summary.total_events)} />
              <SummaryCard label="Órdenes" value={String(summary.total_orders)} />
              <SummaryCard label="Facturación total" value={formatPrice(summary.total_revenue)} />
              <SummaryCard label="A cobrar (1%)" value={formatPrice(summary.total_commission)} />
            </div>

            <PaginatedSection
              title="Próximos eventos"
              description="Eventos con fecha de inicio futura"
              page={upcomingPage}
              pagination={upcoming.pagination}
              loading={upcoming.loading}
              error={upcoming.error}
              onPageChange={setUpcomingPage}
              emptyMessage="No hay eventos próximos"
            >
              <UpcomingTable events={upcoming.data?.events ?? []} />
            </PaginatedSection>

            <PaginatedSection
              title="Facturación por evento"
              description="Ordenado por monto facturado · comisión del 1%"
              page={revenuePage}
              pagination={revenue.pagination}
              loading={revenue.loading}
              error={revenue.error}
              onPageChange={setRevenuePage}
              emptyMessage="Sin datos de facturación"
            >
              <RevenueTable rows={revenue.data?.revenue_by_event ?? []} />
            </PaginatedSection>

            <PaginatedSection
              title="Usuarios"
              page={usersPage}
              pagination={users.pagination}
              loading={users.loading}
              error={users.error}
              onPageChange={setUsersPage}
              emptyMessage="Sin usuarios"
            >
              <UsersTable users={users.data?.users ?? []} />
            </PaginatedSection>

            <PaginatedSection
              title="Eventos"
              page={eventsPage}
              pagination={events.pagination}
              loading={events.loading}
              error={events.error}
              onPageChange={setEventsPage}
              emptyMessage="Sin eventos"
            >
              <EventsTable events={events.data?.events ?? []} />
            </PaginatedSection>

            <PaginatedSection
              title="Órdenes"
              description="Sin órdenes de test"
              page={ordersPage}
              pagination={orders.pagination}
              loading={orders.loading}
              error={orders.error}
              onPageChange={setOrdersPage}
              emptyMessage="Sin órdenes"
            >
              <OrdersTable orders={orders.data?.orders ?? []} />
            </PaginatedSection>
          </>
        )}
      </main>
    </div>
  )
}
