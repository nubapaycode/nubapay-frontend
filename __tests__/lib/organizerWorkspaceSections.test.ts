import type { WorkspaceSectionAccess } from '@/lib/organizerWorkspaceSections'
import { visibleSectionTabs } from '@/lib/organizerWorkspaceSections'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'

const segments = (tabs: { segment: string }[]) => tabs.map(t => t.segment)

const owner: WorkspaceSectionAccess = { membership: 'owner', tools: ORGANIZER_FULL_TOOLS }
const staff = (tools: Partial<typeof ORGANIZER_ZERO_TOOLS> = {}): WorkspaceSectionAccess => ({
  membership: 'staff',
  tools: { ...ORGANIZER_ZERO_TOOLS, ...tools },
})

describe('visibleSectionTabs', () => {
  it('el dueño ve todas las pestañas de cobros', () => {
    expect(segments(visibleSectionTabs('cobros', owner))).toEqual(['payments', 'metodos-pago', 'comision'])
  })

  it('un staff con permiso de pagos solo ve Pagos', () => {
    expect(segments(visibleSectionTabs('cobros', staff({ payments: true })))).toEqual(['payments'])
  })

  it('un staff sin permiso de productos no ve el catálogo', () => {
    expect(visibleSectionTabs('catalogo', staff())).toEqual([])
  })

  it('el permiso de productos habilita Productos y Bloques', () => {
    expect(segments(visibleSectionTabs('catalogo', staff({ products: true })))).toEqual(['products', 'blocks'])
  })
})
