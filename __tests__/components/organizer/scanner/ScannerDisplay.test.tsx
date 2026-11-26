import { act, render, screen, within } from '@testing-library/react'

import { ScannerDisplay } from '@/components/organizer/scanner/ScannerDisplay'
import { type ScanDisplayMessage, subscribeScans } from '@/lib/scanner/displayChannel'

jest.mock('@/lib/scanner/displayChannel', () => ({ subscribeScans: jest.fn() }))

let emit: (msg: ScanDisplayMessage) => void = () => {}

beforeEach(() => {
  jest.useFakeTimers()
  jest.mocked(subscribeScans).mockImplementation(cb => {
    emit = cb
    return () => {}
  })
})

afterEach(() => jest.useRealTimers())

describe('ScannerDisplay (pantalla para el público)', () => {
  it('espera con la marca, pasa a verde con la chapa gigante y vuelve a esperar', () => {
    render(<ScannerDisplay />)
    expect(screen.getByRole('img', { name: 'nubapay' })).toBeInTheDocument()
    expect(screen.getByText('Mostrá tu QR')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('data-result', 'idle')

    act(() => emit({ result: 'ok', headline: 'AB123CD', detail: 'Auto', name: 'Ana Pérez', at: 1 }))
    expect(screen.getByRole('status')).toHaveAttribute('data-result', 'ok')
    const main = screen.getByRole('main')
    expect(within(main).getByText('Puede pasar')).toBeInTheDocument()
    expect(within(main).getByText('AB123CD')).toBeInTheDocument()
    expect(within(main).getByText('Argentina')).toBeInTheDocument() // chapa Mercosur
    expect(within(main).getByText('Auto · Ana Pérez')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(6500))
    expect(screen.getByText('Mostrá tu QR')).toBeInTheDocument()
    // La lectura queda en la tira de últimas.
    expect(within(screen.getByRole('list', { name: 'Últimas lecturas' })).getByText('AB123CD')).toBeInTheDocument()
  })

  it('un error la pone roja con el motivo', () => {
    render(<ScannerDisplay />)
    act(() => emit({ result: 'error', headline: 'CD456EF', reason: 'Este QR ya se usó', at: 1 }))
    expect(screen.getByRole('status')).toHaveAttribute('data-result', 'error')
    const main = screen.getByRole('main')
    expect(within(main).getByText('No pasa')).toBeInTheDocument()
    expect(within(main).getByText('Este QR ya se usó')).toBeInTheDocument()
    expect(within(main).getByText('CD456EF')).toBeInTheDocument()
  })

  it('una lectura nueva reemplaza a la anterior al instante y se suma a la tira', () => {
    render(<ScannerDisplay />)
    act(() => emit({ result: 'error', headline: 'AAA111', reason: 'x', at: 1 }))
    act(() => emit({ result: 'ok', headline: 'BBB222', at: 2 }))
    const main = screen.getByRole('main')
    expect(within(main).getByText('BBB222')).toBeInTheDocument()
    expect(within(main).queryByText('AAA111')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('data-result', 'ok')
    const chips = within(screen.getByRole('list', { name: 'Últimas lecturas' })).getAllByRole('listitem')
    expect(chips.map(c => c.textContent)).toEqual(['BBB222', 'AAA111'])
  })

  it('sin patente (pedido de productos) muestra el número de pedido', () => {
    render(<ScannerDisplay />)
    act(() => emit({ result: 'ok', headline: '#57', at: 1 }))
    expect(within(screen.getByRole('main')).getByText('#57')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).queryByText('Argentina')).not.toBeInTheDocument()
  })
})
