import { extractOrderId } from '@/lib/scanner/extractOrderId'

const ID = '6fe14fc6-3227-4751-b8bc-05909e518171'

describe('extractOrderId', () => {
  it('lee la URL normal del QR', () => {
    expect(extractOrderId(`https://demo.nuba.studio/catalogo/cassette/order/${ID}`)).toBe(ID)
  })

  it('acepta el uuid suelto', () => {
    expect(extractOrderId(ID)).toBe(ID)
    expect(extractOrderId(ID.toUpperCase())).toBe(ID)
  })

  it('recupera el uuid cuando el lector cambió los guiones por barras', () => {
    expect(
      extractOrderId('demo.nuba.studio/catalogo/cassette/order/6fe14fc6/3227/4751/b8bc/05909e518171'),
    ).toBe(ID)
  })

  it('recupera el uuid aunque el lector deforme el protocolo y otros símbolos', () => {
    expect(extractOrderId("https_??demo.nuba.studio?catalogo?cassette?order?6fe14fc6'3227'4751'b8bc'05909e518171")).toBe(ID)
  })

  it('recupera un id suelto deformado por el lector', () => {
    expect(extractOrderId('6fe14fc6/3227/4751/b8bc/05909e518171')).toBe(ID)
  })

  it('con otro texto cae al comportamiento anterior', () => {
    expect(extractOrderId('  abc  ')).toBe('abc')
    expect(extractOrderId('https://x.com/order/')).toBeNull()
  })
})
