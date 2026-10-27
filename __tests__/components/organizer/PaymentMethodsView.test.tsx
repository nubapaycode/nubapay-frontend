import { render, screen, waitFor, within } from '@testing-library/react'

import { PaymentMethodsView } from '@/components/organizer/PaymentMethodsView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

jest.mock('@/lib/organizerEvents', () => ({
  fetchOrganizerEventDetail: jest.fn(),
}))

function mockEvent(overrides: {
  has_mp_token?: boolean
  has_mp_public_key?: boolean
  has_sipago_credentials?: boolean
  mp_card_enabled?: boolean
}) {
  ;(fetchOrganizerEventDetail as jest.Mock).mockResolvedValue({
    ok: true,
    event: {
      id: 'e1',
      name: 'Demo',
      has_mp_token: false,
      has_mp_public_key: false,
      has_sipago_credentials: false,
      mp_card_enabled: false,
      ...overrides,
    },
  })
}

const row = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) })

describe('PaymentMethodsView', () => {
  it('marca como conectada solo la pasarela que tiene credenciales', async () => {
    mockEvent({ has_mp_token: true })
    render(<PaymentMethodsView eventId="e1" />)

    await waitFor(() => expect(screen.getByText('Mercado Pago')).toBeInTheDocument())
    expect(within(row('Mercado Pago')).getByText('Conectada')).toBeInTheDocument()
    expect(within(row('Sipago')).queryByText('Conectada')).not.toBeInTheDocument()
    expect(within(row('Sipago')).getByText('Conectá tu cuenta para recibir pagos')).toBeInTheDocument()
  })

  it('deja apagada la tarjeta en el sitio hasta que haya clave pública', async () => {
    mockEvent({ has_mp_token: true })
    render(<PaymentMethodsView eventId="e1" />)

    const sw = await screen.findByRole('switch', { name: 'Tarjeta en el sitio' })
    expect(sw).not.toBeChecked()
    expect(sw).toBeDisabled()
    expect(screen.getByText('Pegá la clave pública de Mercado Pago para poder activarla')).toBeInTheDocument()
  })

  it('permite activar la tarjeta en el sitio cuando la clave pública ya está', async () => {
    mockEvent({ has_mp_token: true, has_mp_public_key: true, mp_card_enabled: true })
    render(<PaymentMethodsView eventId="e1" />)

    const sw = await screen.findByRole('switch', { name: 'Tarjeta en el sitio' })
    expect(sw).toBeChecked()
    expect(sw).toBeEnabled()
  })

  it('no marca ninguna si el evento no tiene pasarelas conectadas', async () => {
    mockEvent({})
    render(<PaymentMethodsView eventId="e1" />)

    await waitFor(() => expect(screen.getByText('Mercado Pago')).toBeInTheDocument())
    expect(screen.queryByText('Conectada')).not.toBeInTheDocument()
  })
})
