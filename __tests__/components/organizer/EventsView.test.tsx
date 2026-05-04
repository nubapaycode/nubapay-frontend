import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventsView } from '@/components/organizer/EventsView'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}))

jest.mock('@/lib/browserFetch', () => ({
  browserFetch: jest.fn(),
}))

jest.mock('@/lib/authSession', () => ({
  authHeadersJson: () => ({ Authorization: 'Bearer test', 'Content-Type': 'application/json' }),
  getAuthUser: () => ({ email: 'org@test.com', id: 'u1', name: 'Org', role: 'ORGANIZER' }),
  clearAuthSession: jest.fn(),
}))

const mockBrowserFetch = browserFetch as jest.MockedFunction<typeof browserFetch>

const row = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Festival de Verano 2026',
  slug: 'festival-verano-2026',
  description: 'Parque\n\nShow principal',
  cover_image_url: null as string | null,
  starts_at: '2026-01-15T00:00:00',
  ends_at: null as string | null,
  status: 'draft',
  is_active: true,
}

let eventsList: typeof row[] = []

beforeEach(() => {
  eventsList = [row]
  mockBrowserFetch.mockImplementation(async (input: RequestInfo | URL, init?) => {
    const u =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : input instanceof URL
            ? input.href
            : String(input)
    if (u.includes('/events') && (!init?.method || init.method === 'GET')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          events: eventsList,
          pagination: { page: 1, page_size: 8, total: eventsList.length },
        }),
      } as Response
    }
    if (u.includes('/events') && init?.method === 'POST') {
      const created = {
        ...row,
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Nuevo Evento',
      }
      eventsList = [created, ...eventsList]
      return {
        ok: true,
        status: 201,
        json: async () => ({ event: created }),
      } as Response
    }
    if (u.includes(row.id) && init?.method === 'DELETE') {
      eventsList = eventsList.filter(e => e.id !== row.id)
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response
    }
    throw new Error(`Unhandled: ${u} ${init?.method}`)
  })
})

describe('EventsView', () => {
  it('lista eventos desde la API', async () => {
    render(<EventsView />)
    await waitFor(() => expect(screen.getByText('Festival de Verano 2026')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Abrir panel' })).toHaveAttribute(
      'href',
      '/events/11111111-1111-1111-1111-111111111111/dashboard',
    )
  })

  it('elimina un evento', async () => {
    render(<EventsView />)
    await waitFor(() => expect(screen.getByText('Festival de Verano 2026')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Festival de Verano 2026')).not.toBeInTheDocument())
  })

  it('crea un evento desde el drawer', async () => {
    render(<EventsView />)
    await waitFor(() => expect(screen.getByText('Festival de Verano 2026')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo evento' }))
    await userEvent.type(screen.getByPlaceholderText('Nombre del evento'), 'Nuevo Evento')
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    await waitFor(() => expect(screen.getByText('Nuevo Evento')).toBeInTheDocument())
  })
})
