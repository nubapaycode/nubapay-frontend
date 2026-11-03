import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RegretFormView } from '@/components/buyer/RegretFormView'
import { browserFetch } from '@/lib/browserFetch'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
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
  await user.type(screen.getByLabelText(/Nombre y apellido/), 'Ana Pérez')
  await user.type(screen.getByLabelText(/E-mail/), 'ana@example.com')
  await user.type(screen.getByLabelText(/Alias o datos bancarios/), 'ana.perez.mp')
  await user.type(screen.getByLabelText(/WhatsApp/), '+54 9 11 1234 5678')
  await user.type(screen.getByLabelText(/Detalle de compra/), '2 entradas generales')
  await user.upload(
    screen.getByLabelText(/Screenshot de confirmación/),
    new File(['x'], 'compra.png', { type: 'image/png' }),
  )
}

describe('RegretFormView', () => {
  it('no envía si faltan campos y marca los obligatorios', async () => {
    const user = userEvent.setup()
    render(<RegretFormView catalogSlug="fiesta" eventName="Fiesta" />)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(browserFetch).not.toHaveBeenCalled()
    expect(screen.getByText('Completá todos los campos obligatorios.')).toBeInTheDocument()
  })

  it('envía el formulario multipart al endpoint del evento y muestra la confirmación', async () => {
    jest.mocked(browserFetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<RegretFormView catalogSlug="fiesta" eventName="Fiesta" />)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await screen.findByText('Recibimos tu solicitud')
    const [url, init] = jest.mocked(browserFetch).mock.calls[0]
    expect(String(url)).toContain('/catalog/storefront/fiesta/regrets')
    const body = init?.body as FormData
    expect(body.get('email')).toBe('ana@example.com')
    expect(body.get('bank_alias')).toBe('ana.perez.mp')
    expect(body.get('screenshot')).toBeInstanceOf(File)
  })

  it('muestra el error del servidor y deja reintentar', async () => {
    jest.mocked(browserFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Ya enviaste varias solicitudes.' }),
    } as Response)
    const user = userEvent.setup()
    render(<RegretFormView catalogSlug="fiesta" eventName="Fiesta" />)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya enviaste varias solicitudes.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled())
  })
})
