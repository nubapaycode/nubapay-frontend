import { render, screen, within } from '@testing-library/react'

import { EventOrganizerSidebar } from '@/components/organizer/EventOrganizerSidebar'
import { ORGANIZER_FULL_TOOLS } from '@/lib/organizerStaffTools'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }))

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
})

function renderSidebar(backLink?: { href: string; label: string }) {
  return render(
    <EventOrganizerSidebar
      eventTitle="Festival Uno"
      basePath="/eventos/ev-1"
      pathname="/eventos/ev-1/resumen"
      workspaceMembership="owner"
      tools={ORGANIZER_FULL_TOOLS}
      onLogout={() => {}}
      backLink={backLink}
    />,
  )
}

describe('EventOrganizerSidebar · volver al estacionamiento', () => {
  it('muestra el acceso para volver cuando se lo pasan', () => {
    renderSidebar({ href: '/estacionamiento/eventos', label: 'Volver' })
    const sidebar = screen.getByRole('complementary', { name: 'Barra lateral' })
    expect(within(sidebar).getByRole('link', { name: /^Volver$/ })).toHaveAttribute(
      'href',
      '/estacionamiento/eventos',
    )
  })

  it('un evento común no lo muestra', () => {
    renderSidebar()
    expect(screen.queryByRole('link', { name: /^Volver$/ })).not.toBeInTheDocument()
  })

  it('Parking va en la sección del escáner, con título', () => {
    render(
      <EventOrganizerSidebar
        eventTitle="Festival Uno"
        basePath="/eventos/ev-1"
        pathname="/eventos/ev-1/resumen"
        workspaceMembership="owner"
        tools={ORGANIZER_FULL_TOOLS}
        modules={['catalogo', 'tickets', 'parking']}
        onLogout={() => {}}
        groupLabels={{ principal: 'Operación' }}
        showGroupTitles
      />,
    )
    const sidebar = screen.getByRole('complementary', { name: 'Barra lateral' })
    const operacion = within(sidebar).getByRole('group', { name: 'Operación' })
    expect(within(operacion).getByText('Operación')).toBeInTheDocument()
    const hrefs = within(operacion).getAllByRole('link').map(a => a.getAttribute('href'))
    expect(hrefs.indexOf('/eventos/ev-1/parking')).toBe(hrefs.indexOf('/eventos/ev-1/escaner') + 1)
  })
})
