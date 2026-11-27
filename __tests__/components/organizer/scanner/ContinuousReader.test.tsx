import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { ContinuousReader } from '@/components/organizer/scanner/ContinuousReader'
import { confirmCashPayment, scanQrAll } from '@/lib/organizerWorkspace'
import { openScannerDisplay, publishScan } from '@/lib/scanner/displayChannel'
import type { Order } from '@/types'

jest.mock('@/lib/organizerWorkspace', () => ({
  scanQrAll: jest.fn(),
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
  jest.mocked(scanQrAll).mockImplementation(async (_ev, id) => ({ ok: true, order: order(id, { status: 'delivered' }) }))
})

describe('ContinuousReader (lector físico, escaneo continuo)', () => {
  it('escanea uno tras otro sin aceptar: cada lectura entra a la lista y se valida sola', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(B)
    // El campo queda vacío y listo para la siguiente lectura enseguida.
    expect(screen.getByLabelText('Código leído por el lector de QR')).toHaveValue('')
    await waitFor(() => expect(screen.getAllByText('Ingresó')).toHaveLength(2))
    // Un solo viaje al servidor por lectura: valida y canjea todo lo pendiente.
    expect(scanQrAll).toHaveBeenCalledTimes(2)
    expect(scanQrAll).toHaveBeenCalledWith('ev', A)
    expect(scanQrAll).toHaveBeenCalledWith('ev', B)
    const resumen = screen.getByLabelText('Resumen de lecturas')
    expect(within(resumen).getByText('Ingresaron').nextSibling).toHaveTextContent('2')
  })

  it('un error avisa y queda marcado, pero se sigue escaneando', async () => {
    jest.mocked(scanQrAll).mockImplementation(async (_ev, id) =>
      id === A ? { ok: false, error: 'Este QR pertenece a otro evento' } : { ok: true, order: order(id, { status: 'delivered' }) },
    )
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(B)
    await waitFor(() => expect(screen.getByText(/pertenece a otro evento/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Ingresó')).toBeInTheDocument())
    const resumen = screen.getByLabelText('Resumen de lecturas')
    expect(within(resumen).getByText('Para revisar').nextSibling).toHaveTextContent('1')
  })

  it('el mismo QR leído dos veces seguidas se canjea una sola vez', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    scan(A)
    expect(await screen.findByText('Lectura repetida')).toBeInTheDocument()
    await waitFor(() => expect(scanQrAll).toHaveBeenCalledTimes(1))
  })

  it('un QR ya usado queda en amarillo como "Ya estaba escaneado"', async () => {
    jest.mocked(scanQrAll).mockResolvedValue({ ok: false, error: 'Este QR ya fue escaneado', alreadyScanned: true, order: order(C) })
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(C)
    expect(await screen.findByText('Ya estaba escaneado')).toBeInTheDocument()
  })

  it('efectivo pendiente: no ingresa hasta confirmar el cobro desde la fila', async () => {
    // El servidor avisa que falta el cobro y no canjea nada; al confirmarlo, se canjea.
    jest.mocked(scanQrAll)
      .mockResolvedValueOnce({ ok: false, error: 'Falta cobrar el efectivo', cashPending: true, order: order(A, { paymentMethod: 'cash', paymentStatus: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, order: order(A, { status: 'delivered' }) })
    jest.mocked(confirmCashPayment).mockResolvedValue({ ok: true, order: order(A, { paymentMethod: 'cash' }) })
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    const row = (await screen.findByText('Falta cobrar el efectivo')).closest('li') as HTMLElement
    // En la pantalla del público, el efectivo pendiente va en naranja.
    expect(publishScan).toHaveBeenCalledWith(expect.objectContaining({ result: 'pending', reason: 'Falta pagar en efectivo' }))
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
    jest.mocked(scanQrAll).mockImplementation(async (_ev, id) =>
      id === B ? { ok: false, error: 'Este QR ya fue escaneado', alreadyScanned: true, order: order(id) } : { ok: true, order: order(id, { status: 'delivered' }) },
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

  it('filtra por estado y pagina de a 10', async () => {
    jest.mocked(scanQrAll).mockImplementation(async (_ev, id) =>
      id.startsWith('e') ? { ok: false, error: 'Este QR pertenece a otro evento' } : { ok: true, order: order(id, { status: 'delivered' }) },
    )
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    // 11 que ingresan + 1 con error
    for (let i = 0; i < 11; i++) scan(`${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`)
    scan('eeeeeeee-1111-4111-8111-111111111111')
    await waitFor(() => expect(within(screen.getByLabelText('Resumen de lecturas')).getByText('Lecturas').nextSibling).toHaveTextContent('12'))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(10))
    const pager = screen.getByRole('navigation', { name: 'Paginación' })
    fireEvent.click(within(pager).getByRole('button', { name: '2' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    fireEvent.click(screen.getByRole('tab', { name: /Para revisar/ }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText(/pertenece a otro evento/)).toBeInTheDocument()
  })

  it('muestra la patente en la fila', async () => {
    render(<ContinuousReader eventId="ev" onExit={() => {}} />)
    scan(A)
    expect(await screen.findByText('AA111BB')).toBeInTheDocument()
    expect(screen.getByText('Última')).toBeInTheDocument()
  })
})
