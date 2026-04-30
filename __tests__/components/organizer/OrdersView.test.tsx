import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersView } from '@/components/organizer/OrdersView'

describe('OrdersView', () => {
  it('renderiza el kanban con los 4 headers', () => {
    render(<OrdersView eventId="demo-event" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('al marcar listo un pedido, aumenta el conteo de "Confirmar entrega"', async () => {
    render(<OrdersView eventId="demo-event" />)
    const initialConfirmCount = screen.getAllByRole('button', { name: 'Confirmar entrega' }).length
    const markReadyButtons = screen.getAllByRole('button', { name: 'Marcar listo' })
    await userEvent.click(markReadyButtons[0])
    const newConfirmCount = screen.getAllByRole('button', { name: 'Confirmar entrega' }).length
    expect(newConfirmCount).toBe(initialConfirmCount + 1)
  })
})
