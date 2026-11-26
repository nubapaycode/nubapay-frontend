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
    renderSidebar({ href: '/estacionamiento/eventos', label: 'Volver al panel del estacionamiento' })
    const sidebar = screen.getByRole('complementary', { name: 'Barra lateral' })
    expect(within(sidebar).getByRole('link', { name: /Volver al panel del estacionamiento/ })).toHaveAttribute(
      'href',
      '/estacionamiento/eventos',
    )
  })

  it('un evento común no lo muestra', () => {
    renderSidebar()
    expect(screen.queryByText('Volver al panel del estacionamiento')).not.toBeInTheDocument()
  })
})
