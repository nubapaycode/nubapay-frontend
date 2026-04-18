import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventsView } from '@/components/organizer/EventsView'

describe('EventsView', () => {
  it('muestra los eventos mock', () => {
    render(<EventsView />)
    expect(screen.getByText('Festival de Verano 2026')).toBeInTheDocument()
    expect(screen.getByText('Rock en el Parque')).toBeInTheDocument()
  })

  it('elimina un evento al hacer click en Eliminar', async () => {
    render(<EventsView />)
    const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar' })
    await userEvent.click(deleteButtons[0])
    expect(screen.queryByText('Festival de Verano 2026')).not.toBeInTheDocument()
  })

  it('agrega un evento con el formulario', async () => {
    render(<EventsView />)
    await userEvent.type(screen.getByPlaceholderText('Nombre del evento'), 'Nuevo Evento')
    await userEvent.type(screen.getByPlaceholderText('Lugar'), 'Teatro Gran Rex')
    await userEvent.type(screen.getByPlaceholderText('Descripción (opcional)'), 'Descripción')
    const dateInput = screen.getByDisplayValue('')
    await userEvent.type(dateInput, '2026-12-01')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar evento' }))
    expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
  })

  it('no agrega evento sin nombre o lugar', async () => {
    render(<EventsView />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar evento' }))
    expect(screen.getByText('Nombre y lugar son requeridos')).toBeInTheDocument()
  })
})
