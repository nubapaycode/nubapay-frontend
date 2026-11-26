import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EventRequestForm } from '@/components/buyer/EventRequestForm'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))
jest.mock('@/lib/image', () => ({
  isAllowedImageUpload: (f: File) => f.type.startsWith('image/'),
  compressToWebp: async (f: File) => f,
}))

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview')
  URL.revokeObjectURL = jest.fn()
})

beforeEach(() => jest.clearAllMocks())

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre del evento/), 'Festival de Verano')
  await user.type(screen.getByLabelText(/Inicio/), '2026-12-20T20:00')
  await user.type(screen.getByLabelText(/Tu nombre/), 'Ana Pérez')
  await user.type(screen.getByLabelText(/E-mail/), 'ana@example.com')
  await user.type(screen.getByLabelText(/Teléfono/), '+54 9 11 1234 5678')
}

describe('EventRequestForm', () => {
  it('no envía si faltan campos obligatorios y marca los errores', async () => {
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(browserFetch).not.toHaveBeenCalled()
    expect(screen.getByText('Ingresá el nombre del evento.')).toBeInTheDocument()
    expect(screen.getByText('Ingresá un e-mail válido.')).toBeInTheDocument()
  })

  it('envía multipart al endpoint del estacionamiento y muestra la confirmación', async () => {
    jest.mocked(browserFetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.upload(
      screen.getByLabelText(/Portada/),
      new File(['x'], 'portada.png', { type: 'image/png' }),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await screen.findByText('Recibimos tu solicitud')
    const [url, init] = jest.mocked(browserFetch).mock.calls[0]
    expect(String(url)).toContain('/public/parking/playa-norte/event-request')
    const body = init?.body as FormData
    expect(body.get('event_name')).toBe('Festival de Verano')
    expect(body.get('organizer_email')).toBe('ana@example.com')
    expect(body.get('starts_at')).toBe('2026-12-20T20:00')
    expect(body.get('cover')).toBeInstanceOf(File)
    // El señuelo viaja vacío cuando lo completa una persona.
    expect(body.get('website')).toBe('')
  })

  it('rechaza una fecha de fin anterior al inicio', async () => {
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.type(screen.getByLabelText(/Fin/), '2026-12-19T20:00')
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(browserFetch).not.toHaveBeenCalled()
    expect(screen.getByText('El fin no puede ser anterior al inicio.')).toBeInTheDocument()
  })

  it('muestra el error del servidor (429) y deja reintentar', async () => {
    jest.mocked(browserFetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Demasiadas solicitudes. Probá de nuevo más tarde.' }),
    } as Response)
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiadas solicitudes')
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled()
  })
})
