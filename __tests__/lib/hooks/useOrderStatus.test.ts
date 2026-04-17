import { renderHook, act } from '@testing-library/react'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useOrderStatus', () => {
  it('inicia en pending', () => {
    const { result } = renderHook(() => useOrderStatus('order-123'))
    expect(result.current.status).toBe('pending')
  })

  it('avanza a preparing después de 3000ms', () => {
    const { result } = renderHook(() => useOrderStatus('order-123'))
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(result.current.status).toBe('preparing')
  })

  it('avanza a ready después de 6000ms', () => {
    const { result } = renderHook(() => useOrderStatus('order-123'))
    act(() => {
      jest.advanceTimersByTime(6000)
    })
    expect(result.current.status).toBe('ready')
  })
})
