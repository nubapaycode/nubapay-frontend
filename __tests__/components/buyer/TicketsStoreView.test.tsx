import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketsStoreView } from '@/components/buyer/TicketsStoreView'
import type { Event } from '@/types'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const baseEvent: Event = {
  id: 'e1',
  name: 'Fiesta',
  description: '',
  date: '',
  venue: '',
  products: [],
  combos: [],
  blocks: [],
  tickets: [
    { id: 't1', kind: 'ticket', name: 'Entrada general', description: '', price: 5000, available: true },
    { id: 't2', kind: 'ticket', name: 'Parking VIP', description: '', price: 9000, available: true },
  ],
  categories: [],
  showCategoryShortcuts: false,
  paymentsEnabled: true,
}

beforeEach(() => {
  sessionStorage.clear()
  push.mockClear()
})

describe('TicketsStoreView', () => {
  it('lista los tickets del evento', () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.getByText('Entrada general')).toBeInTheDocument()
    expect(screen.getByText('Parking VIP')).toBeInTheDocument()
  })

  it('ofrece volver al catálogo solo si el evento tiene productos', () => {
    const { rerender } = render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.queryByRole('link', { name: /Ver catálogo/ })).not.toBeInTheDocument()
    rerender(
      <TicketsStoreView
        event={{ ...baseEvent, products: [{ id: 'p1', name: 'Gaseosa', description: '', price: 1, category: 'Bebidas', available: true }] }}
        catalogSlug="fiesta"
      />,
    )
    expect(screen.getByRole('link', { name: /Ver catálogo/ })).toHaveAttribute('href', '/catalogo/fiesta')
  })

  it('muestra el estado vacío sin tickets', () => {
    render(<TicketsStoreView event={{ ...baseEvent, tickets: [] }} catalogSlug="fiesta" />)
    expect(screen.getByText('Sin tickets disponibles')).toBeInTheDocument()
  })
  it('muestra "Comprar" al elegir entradas y lleva al checkout de tickets', async () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Entrada general' }))
    await userEvent.click(screen.getByRole('button', { name: 'Agregar uno' }))
    expect(screen.getByText('2 entradas')).toBeInTheDocument()
    expect(screen.getByText(/10\.000/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }))
    expect(push).toHaveBeenCalledWith('/tickets/fiesta/comprar')
    const stored = JSON.parse(sessionStorage.getItem('nubapay_ticket_selection')!)
    expect(stored.lines).toEqual([{ ticketId: 't1', quantity: 2 }])
    expect(stored.expiresAt).toBeGreaterThan(Date.now())
  })

  it('no usa el carrito del catálogo', async () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Parking VIP' }))
    expect(sessionStorage.getItem('nubapay_cart')).toBeNull()
  })
})

describe('TicketsStoreView · parking', () => {
  const parkingEvent: Event = {
    ...baseEvent,
    parking: [
      { id: 'p1', kind: 'parking', icon: 'car', name: 'Auto', description: '', price: 3000, available: true },
      { id: 'p2', kind: 'parking', icon: 'motorcycle', name: 'Moto', description: '', price: 1500, available: true },
    ],
    parkingMapsUrl: 'https://www.google.com/maps/place/X/@-34.6,-58.4,17z',
    modules: ['catalogo', 'tickets', 'parking'],
  }

  it('lista los vehículos de parking y no las entradas', () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByText('Auto')).toBeInTheDocument()
    expect(screen.getByText('Moto')).toBeInTheDocument()
    expect(screen.queryByText('Entrada general')).not.toBeInTheDocument()
    expect(screen.getByText('Elegí tu lugar')).toBeInTheDocument()
  })

  it('muestra el mapa y el botón para abrir Google Maps', () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByTitle('Mapa del estacionamiento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/place/X/@-34.6,-58.4,17z',
    )
  })

  it('el mapa va al final de la página, después de los vehículos', () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    const lastVehicle = screen.getByText('Moto')
    const map = screen.getByTitle('Mapa del estacionamiento')
    const title = screen.getByText('Dónde queda el estacionamiento')
    expect(lastVehicle.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(lastVehicle.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('el mapa es un link a Google Maps y no captura el scroll', () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByTitle('Mapa del estacionamiento')).toHaveClass('pointer-events-none')
    // En desktop sí se puede mover el mapa: el link que lo tapa se oculta.
    expect(screen.getByTitle('Mapa del estacionamiento')).toHaveClass('lg:pointer-events-auto')
    expect(screen.getByRole('link', { name: 'Abrir el estacionamiento en Google Maps' })).toHaveClass('lg:hidden')
    expect(screen.getByRole('link', { name: 'Abrir el estacionamiento en Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/place/X/@-34.6,-58.4,17z',
    )
  })

  it('con un link corto, arma el mapa con la URL resuelta por el servidor', () => {
    render(
      <TicketsStoreView
        event={{
          ...parkingEvent,
          parkingMapsUrl: 'https://maps.app.goo.gl/A1m6jDLCSDZWH4du7',
          parkingMapsResolvedUrl:
            'https://www.google.com/maps/place/X/@-31.377768,-64.2477219,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-31.377768!4d-64.245147',
        }}
        catalogSlug="fiesta"
        kind="parking"
      />,
    )
    expect(screen.getByTitle('Mapa del estacionamiento')).toHaveAttribute(
      'src',
      'https://www.google.com/maps?q=-31.377768%2C-64.245147&output=embed',
    )
    // El link que se abre sigue siendo el que cargó el organizador.
    expect(screen.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute('href', 'https://maps.app.goo.gl/A1m6jDLCSDZWH4du7')
  })

  it('con un link corto que no se pudo resolver, muestra el pin y el botón', () => {
    render(
      <TicketsStoreView
        event={{ ...parkingEvent, parkingMapsUrl: 'https://maps.app.goo.gl/A1m6jDLCSDZWH4du7', parkingMapsResolvedUrl: null }}
        catalogSlug="fiesta"
        kind="parking"
      />,
    )
    expect(screen.queryByTitle('Mapa del estacionamiento')).not.toBeInTheDocument()
    expect(screen.getByText('Dónde queda el estacionamiento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cómo llegar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir el estacionamiento en Google Maps' })).toBeInTheDocument()
  })

  it('no muestra el mapa si el organizador no cargó el link', () => {
    render(<TicketsStoreView event={{ ...parkingEvent, parkingMapsUrl: null }} catalogSlug="fiesta" kind="parking" />)
    expect(screen.queryByTitle('Mapa del estacionamiento')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cómo llegar' })).not.toBeInTheDocument()
  })

  it('no ofrece abrir un link que no es de Google Maps', () => {
    render(<TicketsStoreView event={{ ...parkingEvent, parkingMapsUrl: 'https://evil.com/x' }} catalogSlug="fiesta" kind="parking" />)
    expect(screen.queryByRole('link', { name: 'Cómo llegar' })).not.toBeInTheDocument()
  })

  it('muestra el estado vacío sin parking', () => {
    render(<TicketsStoreView event={{ ...parkingEvent, parking: [] }} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByText('Sin parking disponible')).toBeInTheDocument()
  })

  it('"Comprar" lleva al checkout de parking', async () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Auto' }))
    expect(screen.getByText('1 lugar')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }))
    expect(push).toHaveBeenCalledWith('/parking/fiesta/comprar')
  })

  it('permite un solo lugar por compra: no se puede sumar otro del mismo vehículo', async () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByText(/un solo lugar por compra/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Auto' }))
    expect(screen.getByRole('button', { name: 'Agregar uno' })).toBeDisabled()
  })

  it('elegir otro vehículo reemplaza al anterior', async () => {
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Auto' }))
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Moto' }))
    expect(screen.getByText('1 lugar')).toBeInTheDocument()
    const stored = JSON.parse(sessionStorage.getItem('nubapay_ticket_selection')!)
    expect(stored.lines).toEqual([{ ticketId: 'p2', quantity: 1 }])
  })

  it('recorta a un lugar una selección vieja con varios', () => {
    sessionStorage.setItem(
      'nubapay_ticket_selection',
      JSON.stringify({ slug: 'fiesta#parking', lines: [{ ticketId: 'p1', quantity: 3 }, { ticketId: 'p2', quantity: 1 }] }),
    )
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByText('1 lugar')).toBeInTheDocument()
  })

  it('la selección de parking no se mezcla con la de entradas', async () => {
    const { unmount } = render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Auto' }))
    unmount()
    render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" />)
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()
  })

  it('desde entradas ofrece ir a parking, y desde parking volver a entradas', () => {
    const { rerender } = render(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" />)
    expect(screen.getByRole('link', { name: /Reservá tu estacionamiento/ })).toHaveAttribute('href', '/parking/fiesta')
    rerender(<TicketsStoreView event={parkingEvent} catalogSlug="fiesta" kind="parking" />)
    expect(screen.getByRole('link', { name: /Comprá tus entradas/ })).toHaveAttribute('href', '/tickets/fiesta')
  })
})
