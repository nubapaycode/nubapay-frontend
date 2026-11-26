import { render, screen, waitFor } from '@testing-library/react'

import { InheritedTeamNotice } from '@/components/organizer/InheritedTeamNotice'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

jest.mock('@/lib/organizerEvents', () => ({ fetchOrganizerEventDetail: jest.fn() }))

describe('InheritedTeamNotice', () => {
  it('en un evento de un estacionamiento explica que el equipo general ya trabaja acá', async () => {
    localStorage.setItem('nubapay_user', JSON.stringify({ id: 'u', name: 'U', email: 'u@x.com', role: 'ORGANIZER', modules: ['parking_owner'] }))
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({ ok: true, event: { parent_event_id: 'base-1' } } as never)
    render(<InheritedTeamNotice eventId="ev-1" />)
    expect(await screen.findByText('El equipo de tu estacionamiento también trabaja en este evento')).toBeInTheDocument()
    expect(screen.getByText(/acceso solo a este evento/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver equipo del estacionamiento' })).toHaveAttribute('href', '/estacionamiento/equipo')
    localStorage.clear()
  })

  it('en un evento común no muestra nada', async () => {
    jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({ ok: true, event: { parent_event_id: null } } as never)
    const { container } = render(<InheritedTeamNotice eventId="ev-2" />)
    await waitFor(() => expect(fetchOrganizerEventDetail).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
