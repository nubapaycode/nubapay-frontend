import { computeCartTotals, orderLinePayload } from '@/lib/serviceFee'
import type { ServiceFeePercent } from '@/types'

const WITH_FEE: ServiceFeePercent = { ticket: 5, product: 2 }

describe('computeCartTotals', () => {
  it('cobra 5% sobre tickets', () => {
    const t = computeCartTotals([{ kind: 'ticket', price: 1000, quantity: 2 }], WITH_FEE)
    expect(t).toEqual({ ticketsSubtotal: 2000, productsSubtotal: 0, serviceFee: 100, total: 2100 })
  })

  it('cobra 2% sobre productos y combos', () => {
    const t = computeCartTotals([{ price: 3500, quantity: 2 }, { price: 1200, quantity: 1 }], WITH_FEE)
    expect(t.productsSubtotal).toBe(8200)
    expect(t.serviceFee).toBe(164)
    expect(t.total).toBe(8364)
  })

  it('combina tickets y productos con su tasa respectiva', () => {
    const t = computeCartTotals([
      { kind: 'ticket', price: 1000, quantity: 1 },
      { price: 500, quantity: 2 },
    ], WITH_FEE)
    expect(t.serviceFee).toBe(50 + 20)
    expect(t.total).toBe(2000 + 70)
  })

  it('redondea mitades hacia arriba al centavo, igual que el backend', () => {
    // 10.10 * 5% = 0.505 → 0.51 ; 0.25 * 2% = 0.005 → 0.01
    const t = computeCartTotals([{ kind: 'ticket', price: 10.1, quantity: 1 }, { price: 0.25, quantity: 1 }], WITH_FEE)
    expect(t.serviceFee).toBe(0.52)
  })

  it('usa los porcentajes que manda el backend', () => {
    const t = computeCartTotals([{ kind: 'ticket', price: 1000, quantity: 1 }], { ticket: 10, product: 0 })
    expect(t.serviceFee).toBe(100)
  })

  it('no cobra nada cuando el evento usa comisión (sin porcentajes)', () => {
    const t = computeCartTotals([{ kind: 'ticket', price: 1000, quantity: 1 }, { price: 500, quantity: 2 }])
    expect(t.serviceFee).toBe(0)
    expect(t.total).toBe(2000)
  })

  it('carrito vacío no cobra nada', () => {
    expect(computeCartTotals([]).total).toBe(0)
  })
})

describe('orderLinePayload', () => {
  it('manda tickets como ticket_id', () => {
    expect(orderLinePayload({ kind: 'ticket', productId: 't1', quantity: 2 })).toEqual({ ticket_id: 't1', quantity: 2 })
  })

  it('manda productos como product_id', () => {
    expect(orderLinePayload({ productId: 'p1', quantity: 1 })).toEqual({ product_id: 'p1', quantity: 1 })
  })
})
