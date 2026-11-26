import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EventRequestForm, buildSchedule } from '@/components/buyer/EventRequestForm'
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
  await user.type(screen.getByLabelText(/^Fecha/), '20122099')
  await user.type(screen.getByLabelText(/^Inicio/), '20:00')
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
    expect(body.get('starts_at')).toBe('2099-12-20T20:00')
    expect(body.get('ends_at')).toBeNull()
    expect(body.get('cover')).toBeInstanceOf(File)
    // El señuelo viaja vacío cuando lo completa una persona.
    expect(body.get('website')).toBe('')
  })

  it('rechaza una fecha de fin anterior al inicio en eventos de varios días', async () => {
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.type(screen.getByLabelText(/^Fin/), '04:00')
    await user.click(screen.getByRole('switch', { name: /Dura más de un día/ }))
    const endDate = screen.getByLabelText(/Fecha de fin/)
    await user.clear(endDate)
    await user.type(endDate, '19122099')
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

  it('una hora de fin menor a la de inicio termina al día siguiente', async () => {
    jest.mocked(browserFetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.type(screen.getByLabelText(/^Fin/), '04:00')
    expect(screen.getByText(/termina al día siguiente/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await screen.findByText('Recibimos tu solicitud')
    const body = jest.mocked(browserFetch).mock.calls[0][1]?.body as FormData
    expect(body.get('ends_at')).toBe('2099-12-21T04:00')
  })

  it('no acepta una fecha que ya pasó', async () => {
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    const date = screen.getByLabelText(/^Fecha/)
    await user.clear(date)
    await user.type(date, '01012001')
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(browserFetch).not.toHaveBeenCalled()
    expect(screen.getByText('La fecha ya pasó.')).toBeInTheDocument()
    expect(date).toHaveFocus()
  })

  it('después de enviar deja pedir otro evento conservando los datos de contacto', async () => {
    jest.mocked(browserFetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<EventRequestForm parkingSlug="playa-norte" parkingName="Playa Norte" />)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await user.click(await screen.findByRole('button', { name: /Pedir otro evento/ }))
    expect(screen.getByLabelText(/Nombre del evento/)).toHaveValue('')
    expect(screen.getByLabelText(/E-mail/)).toHaveValue('ana@example.com')
  })
})

describe('buildSchedule', () => {
  const base = { date: '2099-12-20', startTime: '20:00', endTime: '', multiDay: false, endDate: '' }
  it('sin hora de fin no manda fin', () => {
    expect(buildSchedule(base)).toEqual({ startsAt: '2099-12-20T20:00', endsAt: '', nextDay: false })
  })
  it('mismo día si la hora de fin es mayor', () => {
    expect(buildSchedule({ ...base, endTime: '23:30' })?.endsAt).toBe('2099-12-20T23:30')
  })
  it('cruza fin de mes y de año', () => {
    expect(buildSchedule({ ...base, date: '2099-12-31', endTime: '05:00' })?.endsAt).toBe('2100-01-01T05:00')
  })
  it('varios días usa la fecha de fin', () => {
    expect(buildSchedule({ ...base, endTime: '18:00', multiDay: true, endDate: '2099-12-22' })?.endsAt).toBe('2099-12-22T18:00')
  })
})
