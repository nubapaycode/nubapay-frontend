import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketCard } from '@/components/buyer/TicketCard'
import type { Ticket } from '@/types'

const ticket: Ticket = {
  id: 't1',
  kind: 'ticket',
  name: 'Parking VIP',
  description: 'Cochera cubierta',
  price: 15000,
  available: true,
}

describe('TicketCard', () => {
  it('muestra nombre, descripción y precio', () => {
    render(<TicketCard ticket={ticket} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('Parking VIP')).toBeInTheDocument()
    expect(screen.getByText('Cochera cubierta')).toBeInTheDocument()
    expect(screen.getByText(/15.000/)).toBeInTheDocument()
  })

  it('llama onAdd con el ticket', async () => {
    const onAdd = jest.fn()
    render(<TicketCard ticket={ticket} quantity={0} onAdd={onAdd} onUpdateQuantity={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Agregar Parking VIP/ }))
    expect(onAdd).toHaveBeenCalledWith(ticket)
  })

  it('muestra los controles de cantidad cuando ya está en el carrito', async () => {
    const onUpdateQuantity = jest.fn()
    render(<TicketCard ticket={ticket} quantity={2} onAdd={jest.fn()} onUpdateQuantity={onUpdateQuantity} />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar uno' }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('t1', 3)
  })

  it('muestra Agotado y no permite agregar cuando no hay stock', () => {
    render(<TicketCard ticket={{ ...ticket, available: false, remaining: 0 }} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('avisa cuando quedan pocas unidades y frena el + en el tope', () => {
    render(<TicketCard ticket={{ ...ticket, remaining: 3 }} quantity={3} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('¡Quedan 3!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar uno' })).toBeDisabled()
  })

  it('oculta los controles con las compras inhabilitadas', () => {
    render(<TicketCard ticket={ticket} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} cartDisabled />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
