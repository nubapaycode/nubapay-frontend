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
  avg_ticket: 2075,
  active_orders: 3,
  delivered_orders: 1,
  by_status: { paid: 1, partially_delivered: 1, delivered: 1, cancelled: 1 },
  hourly: Array.from({ length: 8 }, (_, i) => ({ hour: `${i}h`, revenue: 0 })),
  payment_breakdown: [
    { key: 'mp' as const, count: 2, revenue: 4300 },
    { key: 'cash' as const, count: 1, revenue: 2800 },
    { key: 'transfer' as const, count: 1, revenue: 1200 },
  ],
  top_products: [
    { name: 'Cerveza', quantity: 6, revenue: 6000 },
    { name: 'Pancho', quantity: 2, revenue: 2300 },
  ],
  live: { orders_last_hour: 3, revenue_last_hour: 2500, per_minute: Array.from({ length: 30 }, () => 0) },
}

const lastCall = () => (fetchEventDashboard as jest.Mock).mock.calls.at(-1)

async function renderLoaded() {
  render(<DashboardView eventId="demo-event" />)
  await screen.findByText('Estado de los pedidos')
}

beforeEach(() => {
  ;(fetchEventDashboard as jest.Mock).mockReset()
  ;(fetchEventDashboard as jest.Mock).mockResolvedValue({ ok: true, data: dashboardPayload })
  window.history.replaceState(null, '', '/events/demo-event/dashboard')
  window.localStorage.clear()
})

describe('DashboardView', () => {
  it('muestra los 4 estados de pedido', async () => {
    await renderLoaded()
    const card = screen.getByText('Estado de los pedidos').closest('section') as HTMLElement
    expect(within(card).getByText('Pagados, sin retirar')).toBeInTheDocument()
    expect(within(card).getByText('Entrega parcial')).toBeInTheDocument()
    expect(within(card).getByText('Finalizados')).toBeInTheDocument()
    expect(within(card).getByText('Cancelados')).toBeInTheDocument()
  })

  it('muestra el total recaudado en la pestaña y en el encabezado', async () => {
    await renderLoaded()
    const tab = screen.getByRole('tab', { name: /Recaudado/ })
    await waitFor(() => expect(tab).toHaveTextContent('8.300'), { timeout: 3000 })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Recaudaste \$8\.300 en todo el evento/)
  })

  it('cambia la métrica del gráfico al tocar una pestaña', async () => {
    await renderLoaded()
    const pedidos = screen.getByRole('tab', { name: /Pedidos/ })
    await userEvent.click(pedidos)
    expect(pedidos).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Recaudado/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('oculta los montos y recuerda la preferencia', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar montos' }))
    expect(screen.getAllByLabelText('Monto oculto').length).toBeGreaterThan(0)
    expect(window.localStorage.getItem('nubapay_hide_amounts')).toBe('1')
  })

  describe('rango de fechas', () => {
    const openPicker = () => userEvent.click(screen.getByRole('button', { name: /^Período/ }))

    it('arranca con todo el evento (sin rango)', async () => {
      await renderLoaded()
      expect(lastCall()).toEqual(['demo-event', null, { payment: null, product: null }])
      expect(screen.getByRole('button', { name: 'Período: Todo el evento' })).toBeInTheDocument()
    })

    it('"Hoy" pide un solo día y queda en la URL', async () => {
      await renderLoaded()
      await openPicker()
      await userEvent.click(screen.getByRole('button', { name: /Hoy/ }))
      await waitFor(() => {
        const [, range] = lastCall()
        expect(range.from).toBe(range.to)
        expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
      expect(window.location.search).toContain('periodo=today')
    })

    it('la tecla S pide los últimos 7 días', async () => {
      await renderLoaded()
      fireEvent.keyDown(document, { key: 's' })
      await waitFor(() => {
        const [, range] = lastCall()
        const days = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000
        expect(days).toBe(6)
      })
    })

    it('el rango personalizado se elige en el calendario (en cualquier orden)', async () => {
      await renderLoaded()
      await openPicker()
      // Mes anterior: todos sus días son pasados, así el test no depende de la fecha de hoy.
      await userEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
      const now = new Date()
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const label = (day: number) =>
        new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
          new Date(prev.getFullYear(), prev.getMonth(), day),
        )
      const iso = (day: number) =>
        `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      // Primero el día 15 y después el 1: se ordenan solos.
      await userEvent.click(screen.getByRole('button', { name: label(15) }))
      expect(screen.getByText('Elegí el día final.')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: label(1) }))
      await waitFor(() =>
        expect(lastCall()).toEqual(['demo-event', { from: iso(1), to: iso(15) }, { payment: null, product: null }]),
      )
      // Se cierra y el botón muestra el rango.
      expect(screen.queryByRole('dialog', { name: 'Elegir período' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Período: 01\// })).toBeInTheDocument()
    })

    it('no deja elegir días futuros', async () => {
      await renderLoaded()
      await openPicker()
      expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      // Si mañana cae en el mes que viene, no hay día futuro visible en este mes.
      if (tomorrow.getMonth() === new Date().getMonth()) {
        const label = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(tomorrow)
        expect(screen.getByRole('button', { name: label })).toBeDisabled()
      }
    })

    it('lee el período desde la URL al cargar', async () => {
      window.history.replaceState(null, '', '/events/demo-event/dashboard?periodo=custom&desde=2026-08-01&hasta=2026-08-15')
      await renderLoaded()
      expect(lastCall()[1]).toEqual({ from: '2026-08-01', to: '2026-08-15' })
    })

    it('con rango muestra el gráfico por día y la comparación', async () => {
      ;(fetchEventDashboard as jest.Mock).mockResolvedValue({
        ok: true,
        data: {
          ...dashboardPayload,
          series: {
            kind: 'daily',
            points: [
              { label: '01/09', revenue: 100, orders: 1, prev_revenue: 50, prev_orders: 1 },
              { label: '02/09', revenue: 50, orders: 1, prev_revenue: 50, prev_orders: 1 },
            ],
          },
          comparison: { total_revenue: 4150, order_count: 2, avg_ticket: 2075, range: { from: '2026-08-30', to: '2026-08-31' } },
        },
      })
      await renderLoaded()
      expect(screen.getByText('Ventas por día')).toBeInTheDocument()
      expect(screen.getByText('Período anterior')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('100% más que el período anterior')
    })
  })

  describe('filtro cruzado', () => {
    it('tocar un método de pago filtra todo el panel', async () => {
      await renderLoaded()
      await userEvent.click(screen.getByRole('button', { name: /Mercado Pago/ }))
      await waitFor(() => expect(lastCall()[2]).toEqual({ payment: 'mp', product: null }))
      expect(window.location.search).toContain('pago=mp')
      await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro Pago Mercado Pago' }))
      await waitFor(() => expect(lastCall()[2]).toEqual({ payment: null, product: null }))
    })

    it('tocar un producto filtra por ese producto', async () => {
      await renderLoaded()
      await userEvent.click(screen.getByRole('button', { name: /Cerveza/ }))
      await waitFor(() => expect(lastCall()[2]).toEqual({ payment: null, product: 'Cerveza' }))
      expect(screen.getByText('Se compra junto con…')).toBeInTheDocument()
    })
  })
})
