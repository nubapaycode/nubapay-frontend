import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  by_status: { paid: 1, partially_delivered: 1, delivered: 1, cancelled: 1 },
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
  it('muestra los 4 estados de pedido', async () => {
    render(<DashboardView eventId="demo-event" />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando métricas…')).not.toBeInTheDocument()
    })
    const card = screen.getByText('Por estado').closest('div.rounded-2xl') as HTMLElement
    expect(card).toBeTruthy()
    expect(within(card).getByText('Pagados')).toBeInTheDocument()
    expect(within(card).getByText('Entrega parcial')).toBeInTheDocument()
    expect(within(card).getByText('Finalizados')).toBeInTheDocument()
    expect(within(card).getByText('Cancelados')).toBeInTheDocument()
  })

  it('muestra el total recaudado formateado', async () => {
    render(<DashboardView eventId="demo-event" />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando métricas…')).not.toBeInTheDocument()
    })
    // El número se anima de 0 al total, así que hay que esperar al valor final.
    await waitFor(
      () => expect(screen.getByText('Recaudado').closest('div')).toHaveTextContent('8.300'),
      { timeout: 3000 },
    )
  })

  describe('rango de fechas', () => {
    it('arranca con todo el evento (sin rango)', async () => {
      render(<DashboardView eventId="demo-event" />)
      await screen.findByText('Por estado')
      expect(fetchEventDashboard).toHaveBeenLastCalledWith('demo-event', null)
      expect(screen.getByText('Mostrando todo el evento')).toBeInTheDocument()
    })

    it('"Hoy" pide un solo día', async () => {
      render(<DashboardView eventId="demo-event" />)
      await screen.findByText('Por estado')
      await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))
      await waitFor(() => {
        const [, range] = (fetchEventDashboard as jest.Mock).mock.calls.at(-1)
        expect(range.from).toBe(range.to)
        expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('"7 días" pide una semana terminando hoy', async () => {
      render(<DashboardView eventId="demo-event" />)
      await screen.findByText('Por estado')
      await userEvent.click(screen.getByRole('button', { name: '7 días' }))
      await waitFor(() => {
        const [, range] = (fetchEventDashboard as jest.Mock).mock.calls.at(-1)
        const days = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000
        expect(days).toBe(6)
      })
    })

    it('"Rango" pide las fechas elegidas', async () => {
      render(<DashboardView eventId="demo-event" />)
      await screen.findByText('Por estado')
      await userEvent.click(screen.getByRole('button', { name: 'Rango' }))
      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } })
      fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-30' } })
      await waitFor(() =>
        expect(fetchEventDashboard).toHaveBeenLastCalledWith('demo-event', { from: '2026-09-01', to: '2026-09-30' }),
      )
      expect(screen.getByText(/01\/09\/2026 – 30\/09\/2026/)).toBeInTheDocument()
    })

    it('con rango muestra el gráfico por día', async () => {
      ;(fetchEventDashboard as jest.Mock).mockResolvedValue({
        ok: true,
        data: {
          ...dashboardPayload,
          series: { kind: 'daily', points: [{ label: '01/09', revenue: 100 }, { label: '02/09', revenue: 50 }] },
        },
      })
      render(<DashboardView eventId="demo-event" />)
      expect(await screen.findByText('Ventas por día')).toBeInTheDocument()
    })
  })
})
