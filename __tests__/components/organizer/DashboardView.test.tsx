import { render, screen, waitFor, within } from '@testing-library/react'
import { DashboardView } from '@/components/organizer/DashboardView'
import { fetchEventDashboard } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchEventDashboard: jest.fn(),
}))

const dashboardPayload = {
  total_revenue: 8300,
  order_count: 4,
  active_orders: 3,
  delivered_orders: 1,
  by_status: { pending: 1, preparing: 1, ready: 1, delivered: 1, cancelled: 0 },
  hourly: Array.from({ length: 8 }, (_, i) => ({ hour: `${i}h`, revenue: 0 })),
  payment_breakdown: [
    { key: 'mp' as const, count: 2, revenue: 4300 },
    { key: 'cash' as const, count: 1, revenue: 2800 },
    { key: 'transfer' as const, count: 1, revenue: 1200 },
  ],
  top_products: [] as { name: string; quantity: number; revenue: number }[],
}

beforeEach(() => {
  ;(fetchEventDashboard as jest.Mock).mockResolvedValue({ ok: true, data: dashboardPayload })
})

describe('DashboardView', () => {
  it('muestra las 4 tarjetas de estado', async () => {
    render(<DashboardView eventId="demo-event" />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando métricas…')).not.toBeInTheDocument()
    })
    const card = screen.getByText('Por estado').closest('div.rounded-2xl')
    expect(card).toBeTruthy()
    expect(within(card!).getByText('Pendientes')).toBeInTheDocument()
    expect(within(card!).getByText('En preparación')).toBeInTheDocument()
    expect(within(card!).getByText('Listos')).toBeInTheDocument()
    expect(within(card!).getByText('Entregados')).toBeInTheDocument()
  })

  it('muestra el total recaudado formateado', async () => {
    render(<DashboardView eventId="demo-event" />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando métricas…')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Recaudado').closest('div')).toHaveTextContent('8.300')
  })
})
