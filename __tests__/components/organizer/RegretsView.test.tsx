import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RegretsView } from '@/components/organizer/RegretsView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import { fetchRegrets } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({ fetchRegrets: jest.fn() }))
jest.mock('@/lib/organizerEvents', () => ({ fetchOrganizerEventDetail: jest.fn() }))
jest.mock('@/lib/hooks/usePublicOrigin', () => ({ usePublicOrigin: () => 'https://fiesta.nubapay.app' }))

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({ ok: true, event: { slug: 'fiesta-2026' } as never })
  jest.mocked(fetchRegrets).mockResolvedValue({
    ok: true,
    regrets: [],
    pagination: { page: 1, page_size: 30, total: 0 },
    pendingCount: 0,
  })
})

describe('RegretsView', () => {
  it('muestra el link público del formulario y lo copia al portapapeles', async () => {
    const user = userEvent.setup()
    render(<RegretsView eventId="e1" />)

    const input = await screen.findByDisplayValue('https://fiesta.nubapay.app/catalogo/fiesta-2026/arrepentimiento')
    expect(input).toHaveAttribute('readonly')
    await user.click(screen.getByRole('button', { name: /Copiar link/ }))
    expect(await navigator.clipboard.readText()).toBe('https://fiesta.nubapay.app/catalogo/fiesta-2026/arrepentimiento')
    expect(await screen.findByRole('button', { name: /Copiado/ })).toBeInTheDocument()
  })
})
