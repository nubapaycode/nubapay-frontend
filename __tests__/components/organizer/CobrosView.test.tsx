import { render, screen } from '@testing-library/react'
import { fetchWorkspacePayments } from '@/lib/organizerWorkspace'

import { CobrosView } from '@/components/organizer/CobrosView'
import type { WorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { WorkspaceAccessProvider } from '@/components/organizer/WorkspaceAccessContext'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'

jest.mock('@/lib/organizerWorkspace', () => ({ fetchWorkspacePayments: jest.fn() }))

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchWorkspacePayments).mockResolvedValue({
    ok: true,
    payments: [],
    pagination: { page: 1, page_size: 1, total: 3 },
    summary: {
      approved: { count: 2, amount: 4500 },
      pending: { count: 1, amount: 151 },
      rejected: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    },
  })
})

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
  it('el dueño ve las herramientas de cobros con sus links (sin Comisión)', () => {
    renderCobros(owner)
    expect(screen.getByRole('link', { name: /Pagos/ })).toHaveAttribute('href', '/events/e1/payments')
    expect(screen.getByRole('link', { name: /Métodos de pago/ })).toHaveAttribute('href', '/events/e1/metodos-pago')
    expect(screen.queryByRole('link', { name: /Comisión/ })).not.toBeInTheDocument()
  })

  it('un staff con permiso de pagos solo ve Pagos', () => {
    renderCobros({ ...owner, membership: 'staff', tools: { ...ORGANIZER_ZERO_TOOLS, payments: true } })
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Pagos/ })).toHaveAttribute('href', '/events/e1/payments')
  })

  it('la tarjeta de Pagos muestra lo cobrado y los pendientes', async () => {
    renderCobros(owner)
    expect(await screen.findByText('· 1 pendientes', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pagos/ })).toHaveTextContent('4.500')
    expect(fetchWorkspacePayments).toHaveBeenCalledWith('e1', { page: 1, pageSize: 1 })
  })

  it('sin permiso de pagos no pide el resumen', () => {
    renderCobros({ ...owner, membership: 'staff', tools: ORGANIZER_ZERO_TOOLS })
    expect(fetchWorkspacePayments).not.toHaveBeenCalled()
  })
})
