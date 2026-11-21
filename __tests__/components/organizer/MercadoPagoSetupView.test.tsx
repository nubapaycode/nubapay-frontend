import { render, screen } from '@testing-library/react'

import { MercadoPagoSetupView } from '@/components/organizer/MercadoPagoSetupView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/lib/organizerEvents', () => ({
  fetchOrganizerEventDetail: jest.fn(),
  patchOrganizerEvent: jest.fn(),
}))

function mockEvent(overrides: { has_mp_token?: boolean; has_mp_public_key?: boolean; mp_card_enabled?: boolean }) {
  ;(fetchOrganizerEventDetail as jest.Mock).mockResolvedValue({
    ok: true,
    event: {
      id: 'e1',
      name: 'Demo',
      has_mp_token: true,
      has_mp_public_key: false,
      mp_card_enabled: false,
      ...overrides,
    },
  })
}

describe('MercadoPagoSetupView — tarjeta en el sitio', () => {
  it('deja el switch apagado y deshabilitado hasta que haya clave pública', async () => {
    mockEvent({})
    render(<MercadoPagoSetupView eventId="e1" />)

    const sw = await screen.findByRole('switch', { name: 'Tarjeta en el sitio' })
    expect(sw).not.toBeChecked()
    expect(sw).toBeDisabled()
  })

  it('permite activarla cuando la clave pública ya está', async () => {
    mockEvent({ has_mp_public_key: true, mp_card_enabled: true })
    render(<MercadoPagoSetupView eventId="e1" />)

    const sw = await screen.findByRole('switch', { name: 'Tarjeta en el sitio' })
    expect(sw).toBeChecked()
    expect(sw).toBeEnabled()
  })

  it('no ofrece el switch si Mercado Pago no está conectado', async () => {
    mockEvent({ has_mp_token: false })
    render(<MercadoPagoSetupView eventId="e1" />)

    await screen.findByText('Conectá tu Mercado Pago')
    expect(screen.queryByRole('switch', { name: 'Tarjeta en el sitio' })).not.toBeInTheDocument()
  })
})
