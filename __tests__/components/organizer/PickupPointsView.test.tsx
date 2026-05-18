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
})
