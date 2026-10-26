import { ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'
import { normalizeRole, roleCounts, similarRoles, typicalToolsForRole } from '@/lib/staffRoles'

describe('staffRoles', () => {
  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(normalizeRole('  Acreditación   General ')).toBe('acreditacion general')
  })

  it('considera parecidos los errores de tipeo y de género, pero no roles distintos', () => {
    expect(similarRoles('acreditador general', 'acreditadora general')).toBe(true)
    expect(similarRoles('acreditacion general', 'acrediacion general')).toBe(true)
    expect(similarRoles('Producción', 'produccion')).toBe(true)
    expect(similarRoles('acreditacion general', 'acreditacion parking')).toBe(false)
    expect(similarRoles('Caja', 'Barra')).toBe(false)
  })

  it('cuenta los roles de mayor a menor', () => {
    expect(roleCounts(['Caja', 'Barra', 'Caja', ''])).toEqual([
      { role: 'Caja', count: 2 },
      { role: 'Barra', count: 1 },
    ])
  })

  it('devuelve las herramientas más comunes de un rol', () => {
    const scanner = { ...ORGANIZER_ZERO_TOOLS, scanner: true }
    const rows = [
      { role: 'acreditador', tools: scanner },
      { role: 'Acreditador', tools: scanner },
      { role: 'acreditadora', tools: { ...scanner, orders: true } },
    ]
    expect(typicalToolsForRole(rows, 'acreditador')).toEqual(scanner)
    expect(typicalToolsForRole(rows, 'Barra')).toBeNull()
  })
})
