import { extractOrderIds } from '@/lib/scanner/extractOrderIds'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

describe('extractOrderIds', () => {
  it('un código', () => expect(extractOrderIds(A)).toEqual([A]))
  it('dos códigos pegados', () => expect(extractOrderIds(`${A}${B}`)).toEqual([A, B]))
  it('mismo código repetido se cuenta una vez', () => expect(extractOrderIds(`${A}${A}`)).toEqual([A]))
  it('uuid deformado por el teclado (/ en vez de -)', () => expect(extractOrderIds(A.replace(/-/g, '/'))).toEqual([A]))
  it('basura: nada', () => expect(extractOrderIds('hola')).toEqual([]))
})
