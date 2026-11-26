import { render, screen } from '@testing-library/react'

import { PaymentMethodsPanel } from '@/components/organizer/dashboard/Panels'
import type { DashboardSummary } from '@/lib/organizerWorkspace'

function summary(breakdown: { key: string; count: number; revenue: number }[]) {
  return { payment_breakdown: breakdown } as unknown as DashboardSummary
}

describe('PaymentMethodsPanel', () => {
  it('lista solo los medios con pedidos', () => {
    render(
      <PaymentMethodsPanel
        summary={summary([
          { key: 'mp', count: 3, revenue: 3000 },
          { key: 'cash', count: 0, revenue: 0 },
        ])}
        hidden={false}
        selected={null}
        onSelect={() => {}}
      />,
    )
    expect(screen.getByText('Mercado Pago')).toBeInTheDocument()
    for (const label of ['Efectivo', 'Sipago', 'Mobbex', 'Transferencia']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it('sin ningún cobro lo dice en vez de mostrar todo en 0', () => {
    render(<PaymentMethodsPanel summary={summary([])} hidden={false} selected={null} onSelect={() => {}} />)
    expect(screen.getByText('Todavía no hay cobros.')).toBeInTheDocument()
    expect(screen.queryByText('Mercado Pago')).not.toBeInTheDocument()
  })

  it('el medio elegido como filtro sigue visible aunque quede en 0, para poder quitarlo', () => {
    render(
      <PaymentMethodsPanel summary={summary([])} hidden={false} selected="sipago" onSelect={() => {}} />,
    )
    expect(screen.getByText('Sipago')).toBeInTheDocument()
  })
})
