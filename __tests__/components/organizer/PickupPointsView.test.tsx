import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PickupPointsView } from '@/components/organizer/PickupPointsView'
import {
  fetchPickupPoints,
  fetchAllWorkspaceProducts,
  fetchAllCategories,
  createPickupPoint,
  deletePickupPoint,
  patchPickupPoint,
} from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchPickupPoints: jest.fn(),
  fetchAllWorkspaceProducts: jest.fn(),
  fetchAllCategories: jest.fn(),
  createPickupPoint: jest.fn(),
  deletePickupPoint: jest.fn(),
  patchPickupPoint: jest.fn(),
  putPickupPointProducts: jest.fn(),
}))

const eventId = 'event-uuid-001'

const mockPickupPoints = [
  {
    id: 'pp-1',
    event_id: eventId,
    name: 'Mostrador Norte',
    description: 'Entrada principal',
    is_active: true,
    products: [],
  },
  {
    id: 'pp-2',
    event_id: eventId,
    name: 'Mostrador Sur',
    description: '',
    is_active: false,
    products: [],
  },
]

beforeEach(() => {
  ;(fetchPickupPoints as jest.Mock).mockResolvedValue({
    ok: true,
    pickup_points: mockPickupPoints,
  })
  ;(fetchAllWorkspaceProducts as jest.Mock).mockResolvedValue({
    ok: true,
    products: [],
  })
  ;(fetchAllCategories as jest.Mock).mockResolvedValue({
    ok: true,
    categories: [],
  })
})

describe('PickupPointsView', () => {
  it('muestra spinner mientras carga', () => {
    ;(fetchPickupPoints as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<PickupPointsView eventId={eventId} />)
    expect(document.querySelector('svg, [class*="animate"]')).toBeTruthy()
  })

  it('muestra los puntos de retiro al cargar', async () => {
    render(<PickupPointsView eventId={eventId} />)
    await waitFor(() => expect(screen.getByText('Mostrador Norte')).toBeInTheDocument())
    expect(screen.getByText('Mostrador Sur')).toBeInTheDocument()
  })

  it('muestra el estado activo/inactivo de cada punto', async () => {
    render(<PickupPointsView eventId={eventId} />)
    await waitFor(() => expect(screen.getByText('Mostrador Norte')).toBeInTheDocument())
    const checkboxes = screen.getAllByRole('checkbox')
    // El primer punto está activo, el segundo no
    const [first, second] = checkboxes
    expect(first).toHaveAttribute('aria-checked', 'true')
    expect(second).toHaveAttribute('aria-checked', 'false')
  })

  it('muestra el botón de crear nuevo punto de retiro', async () => {
    render(<PickupPointsView eventId={eventId} />)
    await waitFor(() => expect(screen.getByText('Mostrador Norte')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Nuevo punto|Crear/ })).toBeInTheDocument()
  })

  it('muestra estado vacío si no hay puntos de retiro', async () => {
    ;(fetchPickupPoints as jest.Mock).mockResolvedValue({ ok: true, pickup_points: [] })
    render(<PickupPointsView eventId={eventId} />)
    await waitFor(() =>
      expect(screen.getByText(/sin puntos de retiro|no hay puntos/i)).toBeInTheDocument(),
    )
  })

  describe('cobertura', () => {
    const product = (id: string, name: string, is_active = true) => ({
      id,
      event_id: eventId,
      category_id: null,
      category_name: null,
      name,
      description: '',
      price: 100,
      currency: 'ARS',
      type: 'single',
      is_active,
      image_url: null,
      combo_lines: [],
    })

    beforeEach(() => {
      ;(fetchPickupPoints as jest.Mock).mockResolvedValue({
        ok: true,
        pickup_points: [
          { ...mockPickupPoints[0], products: [{ product_id: 'a', name: 'Cerveza', type: 'single', is_active: true }] },
          // Pausado: lo que tiene asignado no cuenta como cubierto.
          { ...mockPickupPoints[1], products: [{ product_id: 'b', name: 'Fernet', type: 'single', is_active: true }] },
        ],
      })
      ;(fetchAllWorkspaceProducts as jest.Mock).mockResolvedValue({
        ok: true,
        products: [product('a', 'Cerveza'), product('b', 'Fernet'), product('c', 'Agua'), product('d', 'Viejo', false)],
      })
    })

    it('avisa qué productos en venta no están en ningún punto', async () => {
      render(<PickupPointsView eventId={eventId} />)
      const alert = await screen.findByRole('status')
      expect(alert).toHaveTextContent('2 productos en venta no están en ningún punto')
      expect(alert).toHaveTextContent('Fernet')
      expect(alert).toHaveTextContent('Agua')
      expect(alert).not.toHaveTextContent('Viejo')
    })

    it('"Asignar a…" abre el punto elegido con esos productos sumados', async () => {
      render(<PickupPointsView eventId={eventId} />)
      await userEvent.click(await screen.findByRole('button', { name: /Asignar a/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: /Mostrador Norte/ }))
      expect(await screen.findByText('3 elegidos')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Guardar cambios · 3 productos/ })).toBeInTheDocument()
    })

    it('el filtro "solo sin asignar" oculta lo que ya está en otro punto', async () => {
      render(<PickupPointsView eventId={eventId} />)
      await userEvent.click(await screen.findByRole('button', { name: /Nuevo punto/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Mostrar productos' }))
      // "Cerveza" aparece en la tarjeta del punto y en el selector; "Agua", en el aviso y en el selector.
      expect(screen.getAllByText('Cerveza')).toHaveLength(2)
      await userEvent.click(screen.getByLabelText('Solo los que no están en otro punto'))
      expect(screen.getAllByText('Cerveza')).toHaveLength(1)
      expect(screen.getAllByText('Agua')).toHaveLength(2)
    })
  })
})
