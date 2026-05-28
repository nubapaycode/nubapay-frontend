// __tests__/lib/hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCart } from '@/lib/hooks/useCart'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: 'p1',
  name: 'Hamburguesa Clásica',
  description: 'Medallón de carne',
  price: 3500,
  category: 'Comidas',
  available: true,
}

const mockProduct2: Product = {
  id: 'p2',
  name: 'Pizza',
  description: 'Porción de pizza',
  price: 2800,
  category: 'Comidas',
  available: true,
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('useCart', () => {
  it('inicia con carrito vacío', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.items).toHaveLength(0)
    expect(result.current.total).toBe(0)
    expect(result.current.count).toBe(0)
  })

  it('addItem agrega item con quantity=1', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].productId).toBe('p1')
    expect(result.current.items[0].quantity).toBe(1)
  })

  it('addItem incrementa quantity para item existente', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct) })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('removeItem elimina el item del carrito', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.removeItem('p1') })
    expect(result.current.items).toHaveLength(0)
  })

  it('updateQuantity(id, 0) elimina el item', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.updateQuantity('p1', 0) })
    expect(result.current.items).toHaveLength(0)
  })

  it('calcula total correctamente', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct2) })
    // 3500*2 + 2800*1 = 9800
    expect(result.current.total).toBe(9800)
  })

  it('calcula count correctamente', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct2) })
    expect(result.current.count).toBe(3)
  })

  it('clearCart vacía todos los items', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(mockProduct) })
    act(() => { result.current.addItem(mockProduct2) })
    act(() => { result.current.clearCart() })
    expect(result.current.items).toHaveLength(0)
    expect(result.current.total).toBe(0)
    expect(result.current.count).toBe(0)
  })
})
