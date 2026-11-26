import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ParkingOwnerAccountProvider } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { ParkingOwnerEventsView } from '@/components/parkingOwner/ParkingOwnerEventsView'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))

const mockFetch = browserFetch as jest.MockedFunction<typeof browserFetch>

const account = {
  base_event_id: 'base-1',
  name: 'Playa Norte',
  slug: 'playa-norte',
  accepts_event_submissions: true,
  counts: { pending: 1, approved: 1, rejected: 0 },
}

const submission = {
  id: 'sub-1',
  status: 'pending',
  organizer_name: 'Ana Pérez',
  organizer_email: 'ana@example.com',
  organizer_phone: '+54 9 11 1234 5678',
  event_name: 'Festival de Verano',
  description: 'Un festival',
  starts_at: '2026-12-20T20:00:00',
  ends_at: null,
  cover_image_url: null,
  reject_reason: null,
  event_id: null,
  reviewed_at: null,
  created_at: '2026-11-25T10:00:00',
}

const approvedEvent = {
  id: 'ev-1',
  name: 'Fiesta Aprobada',
  slug: 'fiesta-aprobada',
  description: null,
  cover_image_url: null,
  starts_at: '2026-12-01T20:00:00',
  ends_at: null,
  status: 'draft',
  is_active: true,
  notify_pickup_point: false,
  show_category_shortcuts: false,
  modules: ['catalogo', 'tickets', 'parking'],
}

function renderBare() {
  return render(
    <ParkingOwnerAccountProvider>
      <ParkingOwnerEventsView />
    </ParkingOwnerAccountProvider>,
  )
}

/** Abre el panel y va a la pestaña Pendientes (la lista arranca en Aprobados). */
async function renderView() {
  renderBare()
  fireEvent.click(await screen.findByRole('tab', { name: /Pendientes/ }))
}

function json(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

let pendingItems: unknown[]

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  window.history.replaceState(null, '', '/estacionamiento/eventos')
  pendingItems = [{ event: null, submission }]
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = String(input)
    if (u.includes('/parking-owner/account')) return json({ account })
    if (u.includes('/parking-owner/events?tab=pending')) {
      return json({
        tab: 'pending',
        items: pendingItems,
        counts: account.counts,
        pagination: { page: 1, page_size: 20, total: pendingItems.length },
      })
    }
    if (u.includes('/parking-owner/events?tab=approved')) {
      return json({
        tab: 'approved',
        items: [{ event: approvedEvent, submission: { ...submission, status: 'approved', event_id: 'ev-1' } }],
        counts: account.counts,
        pagination: { page: 1, page_size: 20, total: 1 },
      })
    }
    if (u.includes('/submissions/sub-1/approve') && init?.method === 'POST') {
      pendingItems = []
      return json({ event: { ...approvedEvent, name: 'Festival de Verano' } }, true, 201)
    }
    throw new Error(`Unhandled fetch: ${u} ${init?.method}`)
  })
})

describe('ParkingOwnerEventsView', () => {
  it('muestra el link público y la solicitud pendiente con los datos del organizador', async () => {
    await renderView()
    expect(await screen.findByText('Festival de Verano')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('ana@example.com').closest('a')).toHaveAttribute('href', 'mailto:ana@example.com')
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/5491112345678')
    expect(screen.getByText(/parking\/playa-norte\/solicitar-evento/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pendientes/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('aprobar llama al endpoint, avisa y refresca la lista', async () => {
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Aprobar' }))

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/submissions/sub-1/approve'),
        expect.objectContaining({ method: 'POST' }),
      ),
    )
    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent(/Festival de Verano.*aprobado: ya podés gestionarlo/)
    expect(within(notice).getByRole('link', { name: /Abrir evento/ })).toHaveAttribute('href', expect.stringMatching(/^\/eventos\/ev-1\//))
    await waitFor(() =>
      expect(screen.getByText(/No hay solicitudes pendientes/)).toBeInTheDocument(),
    )
  })

  it('si la solicitud ya estaba resuelta (409) muestra el error y refresca', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = String(input)
      if (u.includes('/parking-owner/account')) return json({ account })
      if (u.includes('/submissions/sub-1/approve') && init?.method === 'POST') {
        pendingItems = []
        return json({ error: 'La solicitud no existe o ya fue resuelta' }, false, 409)
      }
      return json({
        tab: 'pending',
        items: pendingItems,
        counts: account.counts,
        pagination: { page: 1, page_size: 20, total: pendingItems.length },
      })
    })
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Aprobar' }))
    expect(await screen.findByText('La solicitud no existe o ya fue resuelta')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Festival de Verano')).not.toBeInTheDocument())
  })

  it('rechazar pide confirmación y envía el motivo', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = String(input)
      if (u.includes('/parking-owner/account')) return json({ account })
      if (u.includes('/submissions/sub-1/reject') && init?.method === 'POST') {
        pendingItems = []
        return json({ submission: { ...submission, status: 'rejected', reject_reason: 'Fecha ocupada' } })
      }
      return json({
        tab: 'pending',
        items: pendingItems,
        counts: account.counts,
        pagination: { page: 1, page_size: 20, total: pendingItems.length },
      })
    })
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))
    const dialog = screen.getByText(/Vas a rechazar/).closest('div') as HTMLElement
    await user.type(within(dialog.parentElement as HTMLElement).getByPlaceholderText('Motivo (opcional)'), 'Fecha ocupada')
    const confirm = screen.getAllByRole('button', { name: 'Rechazar' }).at(-1) as HTMLElement
    await user.click(confirm)

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(([u]) => String(u).includes('/submissions/sub-1/reject'))
      expect(call).toBeDefined()
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({ reason: 'Fecha ocupada' })
    })
    expect(await screen.findByText('Solicitud rechazada.')).toBeInTheDocument()
  })

  it('la pestaña Aprobados lista los eventos creados con link a su panel', async () => {
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('tab', { name: /Aprobados/ }))
    const card = (await screen.findByText('Fiesta Aprobada')).closest('a')
    expect(card).toHaveAttribute('href', expect.stringMatching(/^\/eventos\/ev-1\//))
    expect(screen.getByText(/Organiza Ana Pérez/)).toBeInTheDocument()
  })

  it('edita el link desde la tarjeta de Eventos', async () => {
    const base = mockFetch.getMockImplementation()!
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/parking-owner/account') && init?.method === 'PATCH') {
        return json({ account: { ...account, ...JSON.parse(String(init.body)) } })
      }
      return base(input, init)
    })
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Editar link' }))
    const input = screen.getByLabelText('Link para solicitar eventos')
    await user.clear(input)
    await user.type(input, 'Playa Sur')
    await user.click(screen.getByRole('button', { name: 'Guardar link' }))
    expect(await screen.findByText(/parking\/playa-sur\/solicitar-evento/)).toBeInTheDocument()
    expect(await screen.findByText('Link actualizado.')).toBeInTheDocument()
  })

  it('si el servidor responde OK pero no cambia el link, lo avisa en vez de dar por guardado', async () => {
    const base = mockFetch.getMockImplementation()!
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/parking-owner/account') && init?.method === 'PATCH') return json({ account })
      return base(input, init)
    })
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Editar link' }))
    const input = screen.getByLabelText('Link para solicitar eventos')
    await user.clear(input)
    await user.type(input, 'otro-link')
    await user.click(screen.getByRole('button', { name: 'Guardar link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('servidor esté actualizado')
  })

  it('primero están los aprobados y la lista arranca ahí; después los pendientes', async () => {
    renderBare()
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map(t => t.textContent?.replace(/\d+/g, '').trim())).toEqual(['Aprobados', 'Pendientes', 'Rechazados'])
    expect(screen.getByRole('tab', { name: /Aprobados/ })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Fiesta Aprobada')).toBeInTheDocument()
  })

  it('estados vacíos: cada pestaña explica qué va ahí y ofrece qué hacer', async () => {
    pendingItems = []
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/parking-owner/account')) return json({ account: { ...account, counts: { pending: 0, approved: 0, rejected: 0 } } })
      return json({ tab: 'x', items: [], counts: { pending: 0, approved: 0, rejected: 0 }, pagination: { page: 1, page_size: 20, total: 0 } })
    })
    renderBare()
    expect(await screen.findByText('Todavía no hay eventos aprobados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copiar link del formulario/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Pendientes/ }))
    expect(await screen.findByText('No hay solicitudes pendientes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Copiar link$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver formulario/ })).toHaveAttribute('href', expect.stringContaining('/parking/playa-norte/solicitar-evento'))

    fireEvent.click(screen.getByRole('tab', { name: /Rechazados/ }))
    expect(await screen.findByText('No rechazaste ninguna solicitud')).toBeInTheDocument()
  })

  it('sin aprobados pero con pendientes, el vacío lleva a las pendientes', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/parking-owner/account')) return json({ account })
      if (u.includes('tab=approved')) return json({ tab: 'approved', items: [], counts: account.counts, pagination: { page: 1, page_size: 20, total: 0 } })
      return json({ tab: 'pending', items: [{ event: null, submission }], counts: account.counts, pagination: { page: 1, page_size: 20, total: 1 } })
    })
    renderBare()
    fireEvent.click(await screen.findByRole('button', { name: /Ver solicitudes pendientes \(1\)/ }))
    expect(await screen.findByText('Festival de Verano')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pendientes/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('la pestaña queda en la URL y se respeta al volver a entrar', async () => {
    renderBare()
    fireEvent.click(await screen.findByRole('tab', { name: /Pendientes/ }))
    expect(window.location.search).toBe('?vista=pendientes')
    fireEvent.click(screen.getByRole('tab', { name: /Aprobados/ }))
    expect(window.location.search).toBe('')
  })

  it('abre directo en Pendientes con ?vista=pendientes', async () => {
    window.history.replaceState(null, '', '/estacionamiento/eventos?vista=pendientes')
    renderBare()
    expect(await screen.findByText('Festival de Verano')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pendientes/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('fuera de Pendientes avisa cuántas solicitudes esperan y lleva a revisarlas', async () => {
    renderBare()
    await screen.findByText('Fiesta Aprobada')
    fireEvent.click(screen.getByRole('button', { name: /1 solicitud espera tu revisión/ }))
    expect(await screen.findByText('Festival de Verano')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /espera tu revisión/ })).not.toBeInTheDocument()
  })

  it('los motivos rápidos completan el motivo del rechazo', async () => {
    const user = userEvent.setup()
    await renderView()
    await screen.findByText('Festival de Verano')
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))
    await user.click(screen.getByRole('button', { name: 'No tenemos capacidad' }))
    expect(screen.getByPlaceholderText('Motivo (opcional)')).toHaveValue('No tenemos capacidad')
  })

  it('crea un evento a mano: activo, con fechas en UTC, y avisa con el acceso al evento', async () => {
    const base = mockFetch.getMockImplementation()!
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (/\/events$/.test(String(input)) && init?.method === 'POST') {
        const body = JSON.parse(String(init.body))
        return json({ event: { ...approvedEvent, id: 'ev-nuevo', name: body.name, status: body.status } }, true, 201)
      }
      return base(input, init)
    })
    const user = userEvent.setup()
    renderBare()
    await user.click(await screen.findByRole('button', { name: /Nuevo evento/ }))
    await user.type(screen.getByLabelText('Nombre del evento'), 'Recital de verano')
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-12-20T20:00' } })
    await user.click(screen.getByRole('button', { name: 'Crear evento' }))

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(([u, i]) => /\/events$/.test(String(u)) && i?.method === 'POST')
      expect(call).toBeDefined()
      const body = JSON.parse(String(call?.[1]?.body))
      expect(body).toMatchObject({ name: 'Recital de verano', status: 'active' })
      expect(body.starts_at).toBe(new Date('2026-12-20T20:00').toISOString())
    })
    expect(await screen.findByText(/creado:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir evento/ })).toHaveAttribute('href', expect.stringMatching(/^\/eventos\/ev-nuevo\//))
  })

  it('no deja crear sin nombre ni fecha', async () => {
    const user = userEvent.setup()
    renderBare()
    await user.click(await screen.findByRole('button', { name: /Nuevo evento/ }))
    await user.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresá el nombre del evento')
    expect(mockFetch.mock.calls.some(([u, i]) => /\/events$/.test(String(u)) && i?.method === 'POST')).toBe(false)
  })
})
