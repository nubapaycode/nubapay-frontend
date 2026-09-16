import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'

import type { WorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { WorkspaceAccessProvider } from '@/components/organizer/WorkspaceAccessContext'
import { WorkspaceSectionTabs } from '@/components/organizer/WorkspaceSectionTabs'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const owner: WorkspaceAccess = {
  basePath: '/events/e1',
  membership: 'owner',
  tools: ORGANIZER_FULL_TOOLS,
  partnerBrand: false,
}

function renderTabs(access: WorkspaceAccess, pathname: string) {
  ;(usePathname as jest.Mock).mockReturnValue(pathname)
  return render(
    <WorkspaceAccessProvider value={access}>
      <WorkspaceSectionTabs section="cobros" label="Secciones de cobros" />
    </WorkspaceAccessProvider>,
  )
}

describe('WorkspaceSectionTabs', () => {
  it('muestra las pestañas de cobros y marca la activa', () => {
    renderTabs(owner, '/events/e1/metodos-pago')
    expect(screen.getByRole('navigation', { name: 'Secciones de cobros' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagos' })).toHaveAttribute('href', '/events/e1/payments')
    expect(screen.getByRole('link', { name: 'Comisión' })).toHaveAttribute('href', '/events/e1/comision')
    expect(screen.getByRole('link', { name: 'Métodos de pago' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Pagos' })).not.toHaveAttribute('aria-current')
  })

  it('no se muestra si el staff tiene una sola pestaña permitida', () => {
    const staff: WorkspaceAccess = {
      ...owner,
      membership: 'staff',
      tools: { ...ORGANIZER_ZERO_TOOLS, payments: true },
    }
    const { container } = renderTabs(staff, '/events/e1/payments')
    expect(container).toBeEmptyDOMElement()
  })

  it('no se muestra en subrutas como la configuración de Mercado Pago', () => {
    const { container } = renderTabs(owner, '/events/e1/metodos-pago/mercadopago')
    expect(container).toBeEmptyDOMElement()
  })
})
