import { formatPrice, formatDate, cn } from '@/lib/utils'

describe('formatPrice', () => {
  it('formatea pesos argentinos', () => {
    const result = formatPrice(1500)
    expect(result).toContain('1.500')
  })

  it('formatea precio cero', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
  })
})

describe('formatDate', () => {
  it('formatea una fecha ISO en formato dd/mm/yyyy', () => {
    const result = formatDate('2026-04-17T10:00:00Z')
    expect(result).toMatch(/17\/04\/2026/)
  })
})

describe('cn', () => {
  it('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignora valores falsy', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('foo', false as unknown as string, 'bar')).toBe('foo bar')
  })

  it('resuelve conflictos de Tailwind (última clase gana)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
