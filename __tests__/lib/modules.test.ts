import { visibleNavItems } from '@/components/organizer/EventOrganizerSidebar'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS, firstAllowedWorkspaceSegment } from '@/lib/organizerStaffTools'
import { DEFAULT_MODULES, hasModule } from '@/lib/modules'
import { PURCHASE_COPY, checkoutPath, itemsOf, selectionScope, storePath } from '@/lib/purchaseKind'
import type { Event, Ticket } from '@/types'

describe('hasModule', () => {
  it('sin configuración explícita, catálogo y tickets sí y parking no (nadie pierde lo que tenía)', () => {
    expect(DEFAULT_MODULES).toEqual(['catalogo', 'tickets'])
    expect(hasModule(undefined, 'catalogo')).toBe(true)
    expect(hasModule(null, 'tickets')).toBe(true)
    expect(hasModule(undefined, 'parking')).toBe(false)
  })

  it('respeta la lista que manda el backend', () => {
    expect(hasModule(['parking'], 'parking')).toBe(true)
    expect(hasModule(['parking'], 'catalogo')).toBe(false)
    expect(hasModule([], 'tickets')).toBe(false)
  })
})

describe('visibleNavItems por módulo', () => {
  const labels = (modules?: string[]) =>
    visibleNavItems('/eventos/e1', ORGANIZER_FULL_TOOLS, 'owner', modules).map(i => i.label)

  it('por defecto muestra Catálogo y Tickets, sin Parking', () => {
    const l = labels()
    expect(l).toEqual(expect.arrayContaining(['Catálogo', 'Tickets', 'Tienda']))
    expect(l).not.toContain('Parking')
  })

  it('con Parking habilitado aparece la herramienta', () => {
    expect(labels(['catalogo', 'tickets', 'parking'])).toContain('Parking')
  })

  it('oculta lo que el dueño no tiene, pero deja Tienda, Pedidos y Escáner', () => {
    const l = labels(['parking'])
    expect(l).toEqual(expect.arrayContaining(['Parking', 'Tienda', 'Pedidos', 'Escáner']))
    expect(l).not.toContain('Catálogo')
    expect(l).not.toContain('Tickets')
  })
})

describe('firstAllowedWorkspaceSegment con módulos', () => {
  const productsOnly = { ...ORGANIZER_ZERO_TOOLS, products: true }

  it('sin módulos explícitos abre Productos', () => {
    expect(firstAllowedWorkspaceSegment(productsOnly)).toBe('productos')
  })

  it('salta los módulos no habilitados para no redirigir a una página bloqueada', () => {
    expect(firstAllowedWorkspaceSegment(productsOnly, ['tickets'])).toBe('tickets')
    expect(firstAllowedWorkspaceSegment(productsOnly, ['parking'])).toBe('parking')
    expect(firstAllowedWorkspaceSegment(productsOnly, [])).toBe('mis-eventos')
  })
})

describe('purchaseKind', () => {
  const ticket: Ticket = { id: 't', kind: 'ticket', name: 'General', description: '', price: 1, available: true }
  const car: Ticket = { id: 'p', kind: 'parking', icon: 'car', name: 'Auto', description: '', price: 1, available: true }
  const event = { tickets: [ticket], parking: [car] } as unknown as Event

  it('cada tipo usa su propia lista, rutas y clave de selección', () => {
    expect(itemsOf(event, 'ticket')).toEqual([ticket])
    expect(itemsOf(event, 'parking')).toEqual([car])
    expect(storePath('fiesta', 'parking')).toBe('/parking/fiesta')
    expect(checkoutPath('fiesta', 'parking')).toBe('/parking/fiesta/comprar')
    expect(checkoutPath('fiesta', 'ticket')).toBe('/tickets/fiesta/comprar')
    // La selección de parking no pisa la de entradas del mismo evento.
    expect(selectionScope('fiesta', 'parking')).not.toBe(selectionScope('fiesta', 'ticket'))
  })

  it('un evento sin parking devuelve lista vacía', () => {
    expect(itemsOf({ tickets: [ticket] } as unknown as Event, 'parking')).toEqual([])
  })

  it('los textos de cada tipo son distintos', () => {
    expect(PURCHASE_COPY.parking.heading).not.toBe(PURCHASE_COPY.ticket.heading)
    expect(PURCHASE_COPY.parking.countLabel(2)).toBe('2 lugares')
    expect(PURCHASE_COPY.ticket.countLabel(1)).toBe('1 entrada')
  })
})
