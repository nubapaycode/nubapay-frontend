import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { ContinuousReader } from '@/components/organizer/scanner/ContinuousReader'
import { confirmCashPayment, previewQr, scanQr } from '@/lib/organizerWorkspace'
import { openScannerDisplay, publishScan } from '@/lib/scanner/displayChannel'
import type { Order } from '@/types'

jest.mock('@/lib/organizerWorkspace', () => ({
  previewQr: jest.fn(),
  scanQr: jest.fn(),
  confirmCashPayment: jest.fn(),
}))
jest.mock('@/lib/scanner/beep', () => ({ beepOk: jest.fn(), beepError: jest.fn(), unlockBeep: jest.fn() }))
jest.mock('@/lib/scanner/displayChannel', () => ({ publishScan: jest.fn(), openScannerDisplay: jest.fn() }))

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'

function order(id: string, over: Partial<Order> = {}): Order {
  return {
    id,
    eventId: 'ev',
    orderNumber: Number(id[0]),
    customerName: `Cliente ${id[0]}`,
    vehiclePlate: `AA${id[0]}${id[0]}${id[0]}BB`,
    items: [{ id: `item-${id[0]}`, productId: 't', name: 'Auto', price: 0, quantity: 1, redeemedQuantity: 0 }],
    total: 0,
    status: 'paid',
    paymentStatus: 'approved',
    createdAt: '',
    ...over,
  } as Order
}

/** Lo que hace un lector físico: teclea el código y manda Enter. */
function scan(code: string) {
  const input = screen.getByLabelText('Código leído por el lector de QR')
  fireEvent.change(input, { target: { value: code } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(previewQr).mockImplementation(async (_ev, id) => ({ ok: true, order: order(id) }))
  jest.mocked(scanQr).mockImplementation(async (_ev, id) => ({ ok: true, order: order(id, { status: 'delivered' }) }))
})

describe('ContinuousReader (lector físico, escaneo continuo)', () => {
  it('escanea uno tras otro sin aceptar: cada lectura entra a la lista y se valida sola', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(B)
    // El campo queda vacío y listo para la siguiente lectura enseguida.
    expect(screen.getByLabelText('Código leído por el lector de QR')).toHaveValue('')
    await waitFor(() => expect(screen.getAllByText('Ingresó')).toHaveLength(2))
    expect(scanQr).toHaveBeenCalledWith('ev', A, { 'item-1': 1 })
    expect(scanQr).toHaveBeenCalledWith('ev', B, { 'item-2': 1 })
    expect(screen.getByText(/2/, { selector: 'span.font-semibold' })).toBeInTheDocument()
  })

  it('un error avisa y queda marcado, pero se sigue escaneando', async () => {
    jest.mocked(previewQr).mockImplementation(async (_ev, id) =>
      id === A ? { ok: false, error: 'Este QR pertenece a otro evento' } : { ok: true, order: order(id) },
    )
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(B)
    await waitFor(() => expect(screen.getByText(/pertenece a otro evento/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Ingresó')).toBeInTheDocument())
    expect(screen.getByText(/para revisar/)).toBeInTheDocument()
  })

  it('el mismo QR leído dos veces seguidas se canjea una sola vez', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(A)
    expect(await screen.findByText('Lectura repetida')).toBeInTheDocument()
    await waitFor(() => expect(scanQr).toHaveBeenCalledTimes(1))
  })

  it('un QR ya usado queda en amarillo como "Ya estaba escaneado"', async () => {
    jest.mocked(previewQr).mockResolvedValue({ ok: false, error: 'Este QR ya fue escaneado', alreadyScanned: true, order: order(C) })
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(C)
    expect(await screen.findByText('Ya estaba escaneado')).toBeInTheDocument()
    expect(scanQr).not.toHaveBeenCalled()
  })

  it('efectivo pendiente: no ingresa hasta confirmar el cobro desde la fila', async () => {
    jest.mocked(previewQr).mockResolvedValue({
      ok: true,
      order: order(A, { paymentMethod: 'cash', paymentStatus: 'pending' }),
    })
    jest.mocked(confirmCashPayment).mockResolvedValue({ ok: true, order: order(A, { paymentMethod: 'cash' }) })
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    const row = (await screen.findByText('Falta cobrar el efectivo')).closest('li') as HTMLElement
    expect(scanQr).not.toHaveBeenCalled()
    fireEvent.click(within(row).getByRole('button', { name: 'Cobré el efectivo' }))
    await waitFor(() => expect(screen.getByText('Ingresó')).toBeInTheDocument())
    expect(confirmCashPayment).toHaveBeenCalledWith('ev', A)
  })

  it('un código que no se reconoce avisa y no frena', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan('basura-sin-uuid')
    expect(await screen.findByText(/No se reconoció el código/)).toBeInTheDocument()
    scan(B)
    await waitFor(() => expect(screen.getByText('Ingresó')).toBeInTheDocument())
  })

  it('dos códigos pegados en una sola lectura (dos lectores a la vez) entran los dos', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(`${A}${B}`)
    await waitFor(() => expect(screen.getAllByText('Ingresó')).toHaveLength(2))
  })

  it('cada resultado se manda a la pantalla del público: verde con la patente o rojo con el motivo', async () => {
    jest.mocked(previewQr).mockImplementation(async (_ev, id) =>
      id === B ? { ok: false, error: 'Este QR ya fue escaneado', alreadyScanned: true, order: order(id) } : { ok: true, order: order(id) },
    )
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    await waitFor(() => expect(publishScan).toHaveBeenCalledWith(expect.objectContaining({ result: 'ok', headline: 'AA111BB', detail: 'Auto', name: 'Cliente 1' })))
    scan(B)
    await waitFor(() =>
      expect(publishScan).toHaveBeenCalledWith(expect.objectContaining({ result: 'error', headline: 'AA222BB', reason: 'Este QR ya se usó' })),
    )
  })

  it('las lecturas repetidas y las que están validando no cambian la pantalla', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(A)
    await waitFor(() => expect(screen.getByText('Ingresó')).toBeInTheDocument())
    expect(publishScan).toHaveBeenCalledTimes(1)
  })

  it('el botón abre la pantalla para el público', () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Abrir pantalla para el público/ }))
    expect(openScannerDisplay).toHaveBeenCalled()
  })
})
