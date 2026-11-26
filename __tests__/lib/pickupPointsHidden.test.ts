import { visibleNavItems } from '@/components/organizer/EventOrganizerSidebar'
import { DOC_ARTICLES, getDocArticle } from '@/lib/docs/organizerDocs'
import { PICKUP_POINTS_ENABLED } from '@/lib/features'
import { ORGANIZER_FULL_TOOLS, ORGANIZER_ZERO_TOOLS, firstAllowedWorkspaceSegment } from '@/lib/organizerStaffTools'

describe('Puntos de retiro apagado', () => {
  it('está apagado', () => {
    expect(PICKUP_POINTS_ENABLED).toBe(false)
  })

  it('no aparece en la barra del evento, ni siquiera para el dueño', () => {
    const hrefs = visibleNavItems('/eventos/ev-1', ORGANIZER_FULL_TOOLS, 'owner', ['catalogo', 'tickets', 'parking']).map(
      i => i.href,
    )
    expect(hrefs).not.toContain('/eventos/ev-1/puntos-de-retiro')
    expect(hrefs).toContain('/eventos/ev-1/pedidos')
  })

  it('un staff que solo tenía ese permiso no cae en la herramienta', () => {
    expect(firstAllowedWorkspaceSegment({ ...ORGANIZER_ZERO_TOOLS, pickup_points: true })).toBe('mis-eventos')
  })

  it('la documentación no lista ni enlaza su guía', () => {
    expect(getDocArticle('puntos-retiro')).toBeUndefined()
    expect(DOC_ARTICLES.some(a => a.related?.includes('puntos-retiro'))).toBe(false)
    expect(DOC_ARTICLES.flatMap(a => a.steps).some(s => s.title === 'Avisá el punto de retiro')).toBe(false)
  })
})
