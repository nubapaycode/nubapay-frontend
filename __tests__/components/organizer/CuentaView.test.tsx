import { render, screen } from '@testing-library/react'

import { CuentaView } from '@/components/organizer/CuentaView'
import type { WorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { WorkspaceAccessProvider } from '@/components/organizer/WorkspaceAccessContext'
import { ORGANIZER_FULL_TOOLS } from '@/lib/organizerStaffTools'

jest.mock('@/lib/authSession', () => ({
  getAuthUser: () => ({ email: 'demo@nubapay.app' }),
}))

const owner: WorkspaceAccess = {
  basePath: '/events/e1',
  membership: 'owner',
  tools: ORGANIZER_FULL_TOOLS,
  partnerBrand: true,
}

function renderCuenta(access: WorkspaceAccess) {
  return render(
    <WorkspaceAccessProvider value={access}>
      <CuentaView />
    </WorkspaceAccessProvider>,
  )
}

describe('CuentaView', () => {
  it('muestra el acceso a Marca y dominios debajo de la sesión activa para un dueño partner', () => {
    renderCuenta(owner)
    const session = screen.getByText('Sesión activa')
    const brandLink = screen.getByRole('link', { name: /Marca y dominios/ })
    expect(screen.getByText('demo@nubapay.app')).toBeInTheDocument()
    expect(brandLink).toHaveAttribute('href', '/events/e1/brand')
    expect(session.compareDocumentPosition(brandLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('no muestra el acceso a la marca si la cuenta no es partner', () => {
    renderCuenta({ ...owner, partnerBrand: false })
    expect(screen.getByText('Sesión activa')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Marca y dominios/ })).not.toBeInTheDocument()
  })

  it('no muestra el acceso a la marca a un integrante del staff', () => {
    renderCuenta({ ...owner, membership: 'staff' })
    expect(screen.queryByRole('link', { name: /Marca y dominios/ })).not.toBeInTheDocument()
  })
})
