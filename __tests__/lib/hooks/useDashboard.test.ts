import { renderHook, act } from '@testing-library/react'
import { useDashboard } from '@/lib/hooks/useDashboard'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useDashboard', () => {
  it('inicia con mockOrders (6 pedidos)', () => {
    const { result } = renderHook(() => useDashboard())
    expect(result.current.orders).toHaveLength(6)
  })

  it('agrega un pedido cada 5000ms', () => {
    const { result } = renderHook(() => useDashboard())
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(result.current.orders).toHaveLength(7)
  })
})
