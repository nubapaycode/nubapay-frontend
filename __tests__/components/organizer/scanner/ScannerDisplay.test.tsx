import { act, render, screen } from '@testing-library/react'

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
  it('espera, se pone verde con la patente gigante y vuelve a esperar', () => {
    render(<ScannerDisplay />)
    expect(screen.getByText('Esperando lectura…')).toBeInTheDocument()

    act(() => emit({ result: 'ok', headline: 'AB123CD', detail: 'Auto', name: 'Ana Pérez', at: Date.now() }))
    const status = screen.getByRole('status')
    expect(status).toHaveStyle({ background: '#16a34a' })
    expect(screen.getByText('Puede pasar')).toBeInTheDocument()
    expect(screen.getByText('AB123CD')).toBeInTheDocument()
    expect(screen.getByText('Auto · Ana Pérez')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(6500))
    expect(screen.getByText('Esperando lectura…')).toBeInTheDocument()
  })

  it('un error la pone roja con el motivo', () => {
    render(<ScannerDisplay />)
    act(() => emit({ result: 'error', headline: 'CD456EF', reason: 'Este QR ya se usó', at: Date.now() }))
    expect(screen.getByRole('status')).toHaveStyle({ background: '#dc2626' })
    expect(screen.getByText('No pasa')).toBeInTheDocument()
    expect(screen.getByText('Este QR ya se usó')).toBeInTheDocument()
    expect(screen.getByText('CD456EF')).toBeInTheDocument()
  })

  it('una lectura nueva reemplaza a la anterior al instante', () => {
    render(<ScannerDisplay />)
    act(() => emit({ result: 'error', headline: 'AAA111', reason: 'x', at: 1 }))
    act(() => emit({ result: 'ok', headline: 'BBB222', at: 2 }))
    expect(screen.getByText('BBB222')).toBeInTheDocument()
    expect(screen.queryByText('AAA111')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveStyle({ background: '#16a34a' })
  })
})
