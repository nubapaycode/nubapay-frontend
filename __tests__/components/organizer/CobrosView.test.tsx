import { render, screen } from '@testing-library/react'

import { CobrosView } from '@/components/organizer/CobrosView'
import type { WorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { WorkspaceAccessProvider } from '@/components/organizer/WorkspaceAccessContext'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'

const owner: WorkspaceAccess = {
  basePath: '/events/e1',
  membership: 'owner',
  tools: ORGANIZER_FULL_TOOLS,
  partnerBrand: false,
}

function renderCobros(access: WorkspaceAccess) {
  return render(
    <WorkspaceAccessProvider value={access}>
      <CobrosView />
    </WorkspaceAccessProvider>,
  )
}

describe('CobrosView', () => {
  it('el dueño ve las tres herramientas de cobros con sus links', () => {
    renderCobros(owner)
    expect(screen.getByRole('link', { name: /Pagos/ })).toHaveAttribute('href', '/events/e1/payments')
    expect(screen.getByRole('link', { name: /Métodos de pago/ })).toHaveAttribute('href', '/events/e1/metodos-pago')
    expect(screen.getByRole('link', { name: /Comisión/ })).toHaveAttribute('href', '/events/e1/comision')
  })

  it('un staff con permiso de pagos solo ve Pagos', () => {
    renderCobros({ ...owner, membership: 'staff', tools: { ...ORGANIZER_ZERO_TOOLS, payments: true } })
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Pagos/ })).toHaveAttribute('href', '/events/e1/payments')
  })
})
