import { render, screen } from '@testing-library/react'

import { MercadoPagoSetupView } from '@/components/organizer/MercadoPagoSetupView'
import { MobbexSetupView } from '@/components/organizer/MobbexSetupView'
import { PaymentMethodsView } from '@/components/organizer/PaymentMethodsView'
import { SipagoSetupView } from '@/components/organizer/SipagoSetupView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
jest.mock('@/lib/organizerEvents', () => ({
  fetchOrganizerEventDetail: jest.fn(),
  patchOrganizerEvent: jest.fn(),
}))

const base = {
  has_mp_token: true,
  has_mp_public_key: false,
  has_sipago_credentials: false,
  has_mobbex_credentials: false,
  cash_enabled: true,
}

describe('PaymentMethodsView', () => {
  it('un evento que hereda los cobros no ofrece conectar pasarelas y manda al estacionamiento', async () => {
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({
      ok: true,
      event: { ...base, inherits_payments: true },
    } as never)
    render(<PaymentMethodsView eventId="child-1" />)

    expect(await screen.findByText('Medios activos: Mercado Pago, Efectivo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir a los cobros del estacionamiento/ })).toHaveAttribute(
      'href',
      '/estacionamiento/cobros/metodos-pago',
    )
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByText('Sipago')).not.toBeInTheDocument()
  })

  it('un evento normal sigue mostrando las pasarelas con sus enlaces por defecto', async () => {
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({
      ok: true,
      event: { ...base, inherits_payments: false },
    } as never)
    render(<PaymentMethodsView eventId="ev-9" />)
    const mp = (await screen.findByText('Mercado Pago')).closest('a')
    expect(mp).toHaveAttribute('href', '/eventos/ev-9/metodos-pago/mercadopago')
  })

  it('con basePath, las pasarelas cuelgan del prefijo dado (panel del estacionamiento)', async () => {
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({
      ok: true,
      event: { ...base, inherits_payments: false },
    } as never)
    render(<PaymentMethodsView eventId="base-1" basePath="/estacionamiento/cobros" />)
    const sipago = (await screen.findByText('Sipago')).closest('a')
    expect(sipago).toHaveAttribute('href', '/estacionamiento/cobros/sipago')
  })
})

describe('pantallas de conexión en un evento de un estacionamiento', () => {
  it.each([
    ['Mercado Pago', MercadoPagoSetupView],
    ['Sipago', SipagoSetupView],
    ['Mobbex', MobbexSetupView],
  ])('%s no deja conectar credenciales propias del evento', async (_name, View) => {
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({
      ok: true,
      event: { ...base, inherits_payments: true },
    } as never)
    render(<View eventId="child-1" />)
    expect(await screen.findByText('Este evento cobra con los medios de tu estacionamiento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir a los cobros del estacionamiento/ })).toHaveAttribute(
      'href',
      '/estacionamiento/cobros/metodos-pago',
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
