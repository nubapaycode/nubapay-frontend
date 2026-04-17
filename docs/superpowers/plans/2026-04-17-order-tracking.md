# Seguimiento de Pedido + QR — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la página de seguimiento de pedido con stepper animado, simulación automática de estados, y página QR de retiro.

**Architecture:** Hook `useOrderStatus` simula la progresión de estados con `setTimeout`. `OrderTracker` usa el hook y renderiza el stepper. `QRDisplay` muestra el QR mockeado. Ambas páginas son Server Components que pasan params como props a Client Components.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, Jest (fake timers), React Testing Library

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/hooks/useOrderStatus.ts` | Simula pending → preparing → ready con setTimeout |
| `components/buyer/OrderTracker.tsx` | Stepper de 4 pasos + botón QR cuando ready |
| `components/buyer/QRDisplay.tsx` | QR mockeado (grilla CSS 10×10) + mensaje de retiro |
| `app/(buyer)/[eventId]/order/[orderId]/page.tsx` | Conectar con OrderTracker |
| `app/(buyer)/[eventId]/qr/[orderId]/page.tsx` | Conectar con QRDisplay |
| `__tests__/lib/hooks/useOrderStatus.test.ts` | 3 tests con fake timers |
| `__tests__/components/buyer/OrderTracker.test.tsx` | 5 tests |
| `__tests__/components/buyer/QRDisplay.test.tsx` | 3 tests |

---

## Tarea 1: Hook useOrderStatus (TDD)

**Files:**
- Create: `__tests__/lib/hooks/useOrderStatus.test.ts`
- Create: `lib/hooks/useOrderStatus.ts`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/lib/hooks/useOrderStatus.test.ts
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
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/lib/hooks/useOrderStatus.test.ts
```

Expected: `FAIL` con "Cannot find module '@/lib/hooks/useOrderStatus'"

- [ ] **Step 3: Implementar useOrderStatus**

```typescript
// lib/hooks/useOrderStatus.ts
'use client'

import { useState, useEffect } from 'react'
import type { OrderStatus } from '@/types'

export function useOrderStatus(_orderId: string): { status: OrderStatus } {
  const [status, setStatus] = useState<OrderStatus>('pending')

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('preparing'), 3000)
    const t2 = setTimeout(() => setStatus('ready'), 6000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [_orderId])

  return { status }
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/lib/hooks/useOrderStatus.test.ts
```

Expected: `PASS` (3 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useOrderStatus.ts __tests__/lib/hooks/useOrderStatus.test.ts
git commit -m "feat: add useOrderStatus hook with simulated state progression"
```

---

## Tarea 2: OrderTracker (TDD)

**Files:**
- Create: `__tests__/components/buyer/OrderTracker.test.tsx`
- Create: `components/buyer/OrderTracker.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/buyer/OrderTracker.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderTracker } from '@/components/buyer/OrderTracker'
import { useRouter } from 'next/navigation'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/hooks/useOrderStatus', () => ({
  useOrderStatus: jest.fn(),
}))

const mockPush = jest.fn()

beforeEach(() => {
  mockPush.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
})

describe('OrderTracker', () => {
  it('muestra los 4 labels del stepper', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'pending' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.getByText('Recibido')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=pending', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'pending' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=preparing', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'preparing' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('muestra botón QR cuando status=ready', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'ready' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.getByRole('button', { name: /Ver QR/ })).toBeInTheDocument()
  })

  it('navega a la página QR al hacer click', async () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'ready' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await userEvent.click(screen.getByRole('button', { name: /Ver QR/ }))
    expect(mockPush).toHaveBeenCalledWith('/demo/qr/abc12345-def')
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/buyer/OrderTracker.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar OrderTracker**

```typescript
// components/buyer/OrderTracker.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'
import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/types'

interface OrderTrackerProps {
  orderId: string
  eventId: string
}

const steps: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Recibido' },
  { key: 'preparing', label: 'En preparación' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
]

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

function getStepState(
  stepKey: OrderStatus,
  currentStatus: OrderStatus
): 'completed' | 'active' | 'pending' {
  const stepIdx = statusOrder.indexOf(stepKey)
  const currentIdx = statusOrder.indexOf(currentStatus)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export function OrderTracker({ orderId, eventId }: OrderTrackerProps) {
  const router = useRouter()
  const { status } = useOrderStatus(orderId)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Tu pedido</h1>
      <p className="text-sm text-gray-500 mb-6">#{orderId.slice(0, 8)}</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-4">
          {steps.map(step => {
            const state = getStepState(step.key, status)
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    state === 'completed'
                      ? 'bg-green-500 text-white'
                      : state === 'active'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {state === 'completed' ? '✓' : state === 'active' ? '●' : '○'}
                </div>
                <span
                  className={`text-sm font-medium ${
                    state === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {status === 'ready' && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push(`/${eventId}/qr/${orderId}`)}
        >
          Ver QR de retiro →
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/buyer/OrderTracker.test.tsx
```

Expected: `PASS` (5 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add components/buyer/OrderTracker.tsx __tests__/components/buyer/OrderTracker.test.tsx
git commit -m "feat: add OrderTracker component with status stepper"
```

---

## Tarea 3: QRDisplay (TDD)

**Files:**
- Create: `__tests__/components/buyer/QRDisplay.test.tsx`
- Create: `components/buyer/QRDisplay.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/buyer/QRDisplay.test.tsx
import { render, screen } from '@testing-library/react'
import { QRDisplay } from '@/components/buyer/QRDisplay'

describe('QRDisplay', () => {
  it('muestra el mensaje de retiro', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('Mostrá este código al retirar tu pedido')).toBeInTheDocument()
  })

  it('muestra el orderId truncado con #', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('#abc12345')).toBeInTheDocument()
  })

  it('muestra badge "Listo para retirar"', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/buyer/QRDisplay.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar QRDisplay**

```typescript
// components/buyer/QRDisplay.tsx
'use client'

import { Badge } from '@/components/ui/Badge'

interface QRDisplayProps {
  orderId: string
}

const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,0],
  [1,0,0,0,0,0,1,0,0,1],
  [1,0,1,1,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0],
  [1,0,0,0,0,0,1,1,0,1],
  [1,1,1,1,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,0,1,1],
  [0,1,0,0,1,0,1,1,0,1],
]

export function QRDisplay({ orderId }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Badge variant="success" className="text-sm px-4 py-1">
        Listo para retirar
      </Badge>

      <p className="text-gray-600">Mostrá este código al retirar tu pedido</p>

      <div className="border-4 border-gray-900 rounded-lg p-4 bg-white">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: 'repeat(10, 1fr)', width: 160 }}
        >
          {QR_PATTERN.flat().map((cell, i) => (
            <div
              key={i}
              className={`w-4 h-4 ${cell ? 'bg-gray-900' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 font-mono">#{orderId.slice(0, 8)}</p>
    </div>
  )
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/buyer/QRDisplay.test.tsx
```

Expected: `PASS` (3 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add components/buyer/QRDisplay.tsx __tests__/components/buyer/QRDisplay.test.tsx
git commit -m "feat: add QRDisplay component with mocked QR code"
```

---

## Tarea 4: Actualizar páginas + build

**Files:**
- Modify: `app/(buyer)/[eventId]/order/[orderId]/page.tsx`
- Modify: `app/(buyer)/[eventId]/qr/[orderId]/page.tsx`

- [ ] **Step 1: Actualizar order/page.tsx**

Reemplazar contenido completo con:

```typescript
// app/(buyer)/[eventId]/order/[orderId]/page.tsx
import type { Metadata } from 'next'
import { OrderTracker } from '@/components/buyer/OrderTracker'

interface OrderPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'Seguimiento — Nubapay',
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { eventId, orderId } = await params
  return (
    <main className="min-h-screen p-4 pb-24">
      <OrderTracker orderId={orderId} eventId={eventId} />
    </main>
  )
}
```

- [ ] **Step 2: Actualizar qr/page.tsx**

Reemplazar contenido completo con:

```typescript
// app/(buyer)/[eventId]/qr/[orderId]/page.tsx
import type { Metadata } from 'next'
import { QRDisplay } from '@/components/buyer/QRDisplay'

interface QRPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'QR de retiro — Nubapay',
}

export default async function QRPage({ params }: QRPageProps) {
  const { orderId } = await params
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <QRDisplay orderId={orderId} />
    </main>
  )
}
```

- [ ] **Step 3: Correr todos los tests**

```bash
npm test
```

Expected: todos los tests pasan (aprox 81 total).

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Expected: build exitoso.

- [ ] **Step 5: Commit**

```bash
git add app/(buyer)/
git commit -m "feat: wire order tracking and QR pages"
```
