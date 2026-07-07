'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { clearAuthSession, getAuthUser } from '@/lib/authSession'
import {
  fetchPlatformOverview,
  type PlatformAdminEvent,
  type PlatformAdminOrder,
  type PlatformAdminOverview,
  type PlatformAdminUser,
  type PlatformRevenueByEvent,
} from '@/lib/platformAdmin'
import { formatDate, formatPrice } from '@/lib/utils'

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

function UsersTable({ users }: { users: PlatformAdminUser[] }) {
  if (!users.length) {
    return <p className="px-4 py-8 text-sm text-white/40">Sin usuarios</p>
  }
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
  if (!events.length) {
    return <p className="px-4 py-8 text-sm text-white/40">Sin eventos</p>
  }
  return (
    <TableWrap>
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Evento</Th>
            <Th>Estado</Th>
            <Th>Fecha</Th>
            <Th>Organizador</Th>
            <Th>Órdenes</Th>
            <Th>Facturado</Th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function OrdersTable({ orders }: { orders: PlatformAdminOrder[] }) {
  if (!orders.length) {
    return <p className="px-4 py-8 text-sm text-white/40">Sin órdenes</p>
  }
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
  if (!rows.length) {
    return <p className="px-4 py-8 text-sm text-white/40">Sin datos de facturación</p>
  }
  return (
    <TableWrap>
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-white/10">
          <tr>
            <Th>Evento</Th>
            <Th>Fecha evento</Th>
            <Th>Tenant</Th>
            <Th>Órdenes</Th>
            <Th>Monto facturado</Th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function UpcomingTable({ events }: { events: PlatformAdminEvent[] }) {
  if (!events.length) {
    return <p className="px-4 py-8 text-sm text-white/40">No hay eventos próximos</p>
  }
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

export function AdminDashboardView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<PlatformAdminOverview | null>(null)

  useEffect(() => {
    ;(async () => {
      const result = await fetchPlatformOverview()
      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }
      setData(result.data)
      setLoading(false)
    })()
  }, [])

  function handleLogout() {
    clearAuthSession()
    router.replace('/login')
  }

  const user = getAuthUser()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0F] px-4 text-center">
        <p className="text-red-300">{error || 'No se pudo cargar el panel'}</p>
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

  const { summary } = data

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

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Usuarios" value={String(summary.total_users)} />
          <SummaryCard label="Eventos" value={String(summary.total_events)} />
          <SummaryCard label="Órdenes" value={String(summary.total_orders)} />
          <SummaryCard label="Facturación total" value={formatPrice(summary.total_revenue)} />
        </div>

        <Section title="Próximos eventos" description="Eventos con fecha de inicio futura">
          <UpcomingTable events={data.upcoming_events} />
        </Section>

        <Section title="Facturación por evento" description="Ordenado por monto facturado">
          <RevenueTable rows={data.revenue_by_event} />
        </Section>

        <Section title="Usuarios" description="Últimos 100 registrados">
          <UsersTable users={data.users} />
        </Section>

        <Section title="Eventos" description="Últimos 100 creados">
          <EventsTable events={data.events} />
        </Section>

        <Section title="Órdenes" description="Últimas 100 órdenes (sin test)">
          <OrdersTable orders={data.orders} />
        </Section>
      </main>
    </div>
  )
}
