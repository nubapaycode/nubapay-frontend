import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { clearAutoSentWalletCodes, MobbexWalletPanel } from '@/components/buyer/MobbexWalletPanel'
import * as wallet from '@/lib/mobbexWallet'

jest.mock('@/lib/mobbexWallet', () => ({
  requestWalletCode: jest.fn(),
  verifyWalletCode: jest.fn(),
  createWalletCheckout: jest.fn(),
  syncWalletPayment: jest.fn(),
  loadWalletSession: jest.fn(),
  saveWalletSession: jest.fn(),
  clearWalletSession: jest.fn(),
  loadMobbexJs: jest.fn(),
  loadMobbexEmbed: jest.fn(),
  paySavedCard: jest.fn(),
}))

const m = wallet as jest.Mocked<typeof wallet>

const CHECKOUT = {
  checkout_id: 'CHK:1',
  intent_token: 'intent-1',
  embed_version: '1.2.0',
  email: 'ana@example.com',
  amount: 150,
  cards: [
    {
      source_id: 'src-visa',
      name: 'Visa terminada en 2450',
      brand: 'Visa',
      last4: '2450',
      exp_month: 12,
      exp_year: 2034,
      installments: [
        { reference: 'inst-1', name: '1 cuota de $150' },
        { reference: 'inst-3', name: '3 cuotas de $60' },
      ],
    },
  ],
}

beforeEach(() => {
  jest.resetAllMocks()
  clearAutoSentWalletCodes()
  m.loadWalletSession.mockReturnValue(null)
})

describe('MobbexWalletPanel', () => {
  it('no muestra tarjetas hasta verificar el email con un código', async () => {
    m.requestWalletCode.mockResolvedValue({ ok: true, data: { ok: true, cooldown: 60 } })
    render(<MobbexWalletPanel orderId="o1" initialEmail="ana@example.com" amount={150} onSettled={jest.fn()} />)

    expect(screen.queryByText('Modo prueba')).not.toBeInTheDocument()
    expect(screen.queryByText(/Sandbox/)).not.toBeInTheDocument()
    expect(m.createWalletCheckout).not.toHaveBeenCalled()
    expect(screen.queryByText(/••••/)).not.toBeInTheDocument()

    await waitFor(() => expect(m.requestWalletCode).toHaveBeenCalledWith('ana@example.com', 'o1'))
    expect(m.requestWalletCode).toHaveBeenCalledTimes(1)
    expect(await screen.findByLabelText('Código de verificación')).toBeInTheDocument()
  })

  it('con el código correcto lista las tarjetas y paga con una guardada', async () => {
    m.requestWalletCode.mockResolvedValue({ ok: true, data: { ok: true, cooldown: 60 } })
    m.verifyWalletCode.mockResolvedValue({
      ok: true,
      data: { session_token: 'sess', expires_in: 900, email: 'ana@example.com' },
    })
    m.createWalletCheckout.mockResolvedValue({ ok: true, data: CHECKOUT })
    m.paySavedCard.mockResolvedValue({ result: true, data: { status: { code: '200' } } })
    m.syncWalletPayment.mockResolvedValue({ ok: true, data: { status: 'approved' } })
    const onSettled = jest.fn()

    render(<MobbexWalletPanel orderId="o1" catalogSlug="evento" initialEmail="ana@example.com" amount={150} onSettled={onSettled} />)
    await userEvent.type(await screen.findByLabelText('Código de verificación'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(m.verifyWalletCode).toHaveBeenCalledWith('ana@example.com', '123456')
    expect(m.saveWalletSession).toHaveBeenCalledWith('sess', 900)
    expect(m.createWalletCheckout).toHaveBeenCalledWith('o1', 'sess', 'evento')

    // Solo se muestran datos enmascarados de la tarjeta.
    expect(await screen.findByText(/Visa •••• 2450/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    expect(m.paySavedCard).not.toHaveBeenCalled()
    expect(await screen.findByRole('alert')).toHaveTextContent('código de seguridad')

    await userEvent.type(screen.getByLabelText('Código de seguridad'), '200')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))

    await waitFor(() =>
      expect(m.paySavedCard).toHaveBeenCalledWith({
        intentToken: 'intent-1',
        sourceId: 'src-visa',
        installment: 'inst-1',
        securityCode: '200',
      }),
    )
    await waitFor(() => expect(onSettled).toHaveBeenCalled())
    expect(m.syncWalletPayment).toHaveBeenCalledWith('o1')
  })

  it('reutiliza la sesión verificada y no vuelve a pedir el código', async () => {
    m.loadWalletSession.mockReturnValue('sess')
    m.createWalletCheckout.mockResolvedValue({ ok: true, data: CHECKOUT })
    render(<MobbexWalletPanel orderId="o1" amount={150} onSettled={jest.fn()} />)

    expect(await screen.findByText(/Visa •••• 2450/)).toBeInTheDocument()
    expect(m.requestWalletCode).not.toHaveBeenCalled()
  })

  it('si la sesión venció vuelve a pedir la verificación', async () => {
    m.loadWalletSession.mockReturnValue('vencida')
    m.createWalletCheckout.mockResolvedValue({ ok: false, error: 'Verificá tu email', status: 401 })
    render(<MobbexWalletPanel orderId="o1" amount={150} onSettled={jest.fn()} />)

    expect(await screen.findByRole('button', { name: 'Enviarme el código' })).toBeInTheDocument()
    expect(m.clearWalletSession).toHaveBeenCalled()
  })

  it('al usar otra tarjeta esconde las guardadas y permite volver', async () => {
    m.loadWalletSession.mockReturnValue('sess')
    m.createWalletCheckout.mockResolvedValue({ ok: true, data: CHECKOUT })
    const open = jest.fn()
    const close = jest.fn()
    let onClose: (cancelled: boolean) => void = () => {}
    const init = jest.fn().mockImplementation(opts => {
      onClose = opts.onClose
      return { open, close }
    })
    m.loadMobbexEmbed.mockResolvedValue({ init } as never)
    render(<MobbexWalletPanel orderId="o1" amount={150} onSettled={jest.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Usar otra tarjeta' }))
    await waitFor(() => expect(open).toHaveBeenCalled())

    expect(screen.queryByText(/Visa •••• 2450/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Usar otra tarjeta' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Volver a mis tarjetas/ }))
    expect(close).toHaveBeenCalled()
    act(() => onClose(true))

    expect(await screen.findByText(/Visa •••• 2450/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Volver a mis tarjetas/ })).not.toBeInTheDocument()
  })

  it('sin tarjetas guardadas ofrece pagar con una nueva en el checkout embebido', async () => {
    m.loadWalletSession.mockReturnValue('sess')
    m.createWalletCheckout.mockResolvedValue({ ok: true, data: { ...CHECKOUT, cards: [] } })
    const open = jest.fn()
    m.loadMobbexEmbed.mockResolvedValue({ init: jest.fn().mockReturnValue({ open, close: jest.fn() }) } as never)
    render(<MobbexWalletPanel orderId="o1" amount={150} onSettled={jest.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: /con una tarjeta nueva/ }))
    await waitFor(() => expect(open).toHaveBeenCalledWith({ type: 'checkout', id: 'CHK:1' }))
  })
})
