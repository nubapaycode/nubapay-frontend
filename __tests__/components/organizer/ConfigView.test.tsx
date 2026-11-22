import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigView } from '@/components/organizer/ConfigView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

jest.mock('@/lib/organizerEvents', () => ({
  fetchOrganizerEventDetail: jest.fn(),
  patchOrganizerEvent: jest.fn(),
}))

function mockEvent(over: object = {}) {
  ;(fetchOrganizerEventDetail as jest.Mock).mockResolvedValue({
    ok: true,
    event: {
      id: 'e1',
      name: 'Fiesta',
      description: null,
      starts_at: '2026-12-01T20:00:00',
      ends_at: null,
      is_active: true,
      notify_pickup_point: false,
      purchase_cutoff_hours: null,
      ...over,
    },
  })
}

const SUMMARY = /te mandamos por email un resumen con las compras y las estadísticas/

describe('ConfigView · cierre de compra', () => {
  it('sin cierre activado no promete el resumen por email', async () => {
    mockEvent()
    render(<ConfigView eventId="e1" />)
    await screen.findByRole('switch', { name: 'Cerrar la compra antes del evento' })
    expect(screen.queryByText(SUMMARY)).not.toBeInTheDocument()
  })

  it('con el cierre activado avisa que al cerrar llega un resumen por email', async () => {
    mockEvent({ purchase_cutoff_hours: 3 })
    render(<ConfigView eventId="e1" />)
    expect(await screen.findByText(SUMMARY)).toBeInTheDocument()
    expect(screen.getByLabelText('Horas antes del inicio')).toHaveValue(3)
  })

  it('al activar el switch aparece el aviso', async () => {
    mockEvent()
    render(<ConfigView eventId="e1" />)
    await userEvent.click(await screen.findByRole('switch', { name: 'Cerrar la compra antes del evento' }))
    expect(screen.getByText(SUMMARY)).toBeInTheDocument()
  })
})
