# Nubapay Frontend — Plan de Implementación Inicial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inicializar el proyecto Next.js 15 de Nubapay con estructura de carpetas, tipos compartidos, utilidades testeadas, componentes UI base y páginas scaffoldeadas para buyer y organizer.

**Architecture:** Monorepo Next.js 15 con App Router usando route groups `(buyer)` y `(organizer)`. Carrito vive en localStorage + estado local de React. Sin estado global.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, npm, Jest, React Testing Library

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `types/index.ts` | Tipos globales compartidos (Event, Product, Order, etc.) |
| `lib/utils.ts` | Utilidades puras: `formatPrice`, `formatDate`, `cn` |
| `lib/fetcher.ts` | Wrapper de fetch tipado con manejo de errores |
| `components/ui/Spinner.tsx` | Spinner de carga animado |
| `components/ui/Badge.tsx` | Badge de estado con variantes de color |
| `components/ui/Button.tsx` | Botón con variantes, tamaños y estado loading |
| `components/ui/Card.tsx` | Contenedor con sombra y borde |
| `components/ui/Modal.tsx` | Modal con overlay, cierre por Escape y click exterior |
| `components/ui/index.ts` | Barrel export de todos los componentes UI |
| `app/(buyer)/[eventId]/page.tsx` | Catálogo de productos del evento |
| `app/(buyer)/[eventId]/cart/page.tsx` | Carrito del comprador |
| `app/(buyer)/[eventId]/checkout/page.tsx` | Pago |
| `app/(buyer)/[eventId]/order/[orderId]/page.tsx` | Seguimiento del pedido |
| `app/(buyer)/[eventId]/qr/[orderId]/page.tsx` | QR antifraude para retiro |
| `app/(organizer)/dashboard/page.tsx` | Resumen en tiempo real para el organizador |
| `app/(organizer)/orders/page.tsx` | Gestión de pedidos |
| `app/(organizer)/products/page.tsx` | CRUD de productos y combos |
| `jest.config.ts` | Configuración de Jest con next/jest |
| `jest.setup.ts` | Setup de @testing-library/jest-dom |
| `__tests__/lib/utils.test.ts` | Tests de formatPrice, formatDate, cn |
| `__tests__/components/ui/Spinner.test.tsx` | Tests de Spinner |
| `__tests__/components/ui/Badge.test.tsx` | Tests de Badge |
| `__tests__/components/ui/Button.test.tsx` | Tests de Button |
| `__tests__/components/ui/Card.test.tsx` | Tests de Card |
| `__tests__/components/ui/Modal.test.tsx` | Tests de Modal |

---

## Tarea 1: Inicializar proyecto Next.js 15

**Files:**
- Create: todos los archivos del proyecto base (vía create-next-app)

- [ ] **Step 1: Correr create-next-app**

```bash
cd /Users/budi/Desktop/Proyectos/nubapay/nubapay-frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: proyecto inicializado, dependencias instaladas, commit inicial creado por CNA.

- [ ] **Step 2: Instalar dependencias adicionales**

```bash
npm install clsx tailwind-merge
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest
```

- [ ] **Step 3: Verificar que el proyecto arranca**

```bash
npm run dev
```

Abrir http://localhost:3000 — debe mostrar la página de bienvenida de Next.js. Detener el servidor con `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add clsx, tailwind-merge and testing dependencies"
```

---

## Tarea 2: Configurar Jest + React Testing Library

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` — agregar scripts de test
- Modify: `tsconfig.json` — agregar tipos de jest

- [ ] **Step 1: Crear jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
}

export default createJestConfig(config)
```

- [ ] **Step 2: Crear jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Agregar scripts de test en package.json**

En el bloque `"scripts"` de `package.json`, agregar las dos líneas:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Agregar tipos en tsconfig.json**

En `compilerOptions` de `tsconfig.json`, agregar o actualizar el campo `"types"`:

```json
"types": ["jest", "@testing-library/jest-dom"]
```

- [ ] **Step 5: Crear directorios de tests**

```bash
mkdir -p __tests__/lib __tests__/components/ui
```

- [ ] **Step 6: Verificar configuración**

Crear `__tests__/setup.test.ts`:
```typescript
it('jest funciona', () => {
  expect(1 + 1).toBe(2)
})
```

Correr:
```bash
npm test
```

Expected: `PASS __tests__/setup.test.ts`

- [ ] **Step 7: Eliminar test temporal y commitear**

```bash
rm __tests__/setup.test.ts
git add jest.config.ts jest.setup.ts tsconfig.json package.json __tests__/
git commit -m "chore: configure Jest and React Testing Library"
```

---

## Tarea 3: Definir tipos globales

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Crear types/index.ts**

```typescript
// types/index.ts

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  category: string
  available: boolean
}

export interface Combo {
  id: string
  name: string
  description: string
  price: number
  products: Product[]
  imageUrl?: string
  available: boolean
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

export interface Order {
  id: string
  eventId: string
  items: CartItem[]
  total: number
  status: OrderStatus
  qrToken: string
  createdAt: string
  updatedAt: string
  pickupPoint?: string
}

export interface Event {
  id: string
  name: string
  description: string
  date: string
  venue: string
  products: Product[]
  combos: Combo[]
}

export interface QRToken {
  orderId: string
  token: string
  expiresAt: string
}
```

- [ ] **Step 2: Verificar que TypeScript compila sin errores**

```bash
npx tsc --noEmit
```

Expected: sin output (sin errores).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: define shared TypeScript types"
```

---

## Tarea 4: Implementar utilidades (TDD)

**Files:**
- Create: `__tests__/lib/utils.test.ts`
- Create: `lib/utils.ts`
- Create: `lib/fetcher.ts`

- [ ] **Step 1: Escribir tests de utils**

```typescript
// __tests__/lib/utils.test.ts
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
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/lib/utils.test.ts
```

Expected: `FAIL` con "Cannot find module '@/lib/utils'"

- [ ] **Step 3: Implementar lib/utils.ts**

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}
```

- [ ] **Step 4: Implementar lib/fetcher.ts**

```typescript
// lib/fetcher.ts
export class FetchError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FetchError'
    this.status = status
  }
}

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new FetchError(`HTTP error ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}
```

- [ ] **Step 5: Correr tests — deben pasar**

```bash
npm test -- __tests__/lib/utils.test.ts
```

Expected: `PASS` con 5 tests verdes.

- [ ] **Step 6: Commit**

```bash
git add lib/ __tests__/lib/
git commit -m "feat: implement shared utilities (formatPrice, formatDate, cn, fetcher)"
```

---

## Tarea 5: Componentes Spinner y Badge (TDD)

**Files:**
- Create: `components/ui/Spinner.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `__tests__/components/ui/Spinner.test.tsx`
- Create: `__tests__/components/ui/Badge.test.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/ui/Spinner.test.tsx
import { render, screen } from '@testing-library/react'
import { Spinner } from '@/components/ui/Spinner'

describe('Spinner', () => {
  it('renderiza el spinner con role status', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('aplica clase de tamaño sm', () => {
    render(<Spinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4')
  })

  it('aplica clase de tamaño lg', () => {
    render(<Spinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8')
  })
})
```

```typescript
// __tests__/components/ui/Badge.test.tsx
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renderiza el texto', () => {
    render(<Badge>Listo</Badge>)
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('variante success aplica clases verdes', () => {
    render(<Badge variant="success">OK</Badge>)
    expect(screen.getByText('OK')).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('variante danger aplica clases rojas', () => {
    render(<Badge variant="danger">Error</Badge>)
    expect(screen.getByText('Error')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('variante default aplica clases grises', () => {
    render(<Badge>Pendiente</Badge>)
    expect(screen.getByText('Pendiente')).toHaveClass('bg-gray-100', 'text-gray-800')
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/ui/Spinner.test.tsx __tests__/components/ui/Badge.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Crear carpeta y implementar Spinner**

```bash
mkdir -p components/ui
```

```typescript
// components/ui/Spinner.tsx
import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label="Cargando"
      className={cn('animate-spin text-current', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
```

- [ ] **Step 4: Implementar Badge**

```typescript
// components/ui/Badge.tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/ui/Spinner.test.tsx __tests__/components/ui/Badge.test.tsx
```

Expected: `PASS` (7 tests verdes)

- [ ] **Step 6: Commit**

```bash
git add components/ui/Spinner.tsx components/ui/Badge.tsx __tests__/components/ui/
git commit -m "feat: add Spinner and Badge UI components"
```

---

## Tarea 6: Componentes Button y Card (TDD)

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `__tests__/components/ui/Button.test.tsx`
- Create: `__tests__/components/ui/Card.test.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renderiza el texto del botón', () => {
    render(<Button>Pagar</Button>)
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
  })

  it('llama onClick al hacer click', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Pagar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('está deshabilitado cuando disabled=true', () => {
    render(<Button disabled>Pagar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('está deshabilitado y muestra spinner cuando loading=true', () => {
    render(<Button loading>Pagar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('no llama onClick cuando está deshabilitado', async () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Pagar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

```typescript
// __tests__/components/ui/Card.test.tsx
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renderiza los hijos', () => {
    render(<Card>Contenido de tarjeta</Card>)
    expect(screen.getByText('Contenido de tarjeta')).toBeInTheDocument()
  })

  it('aplica className adicional', () => {
    const { container } = render(<Card className="mi-clase">X</Card>)
    expect(container.firstChild).toHaveClass('mi-clase')
  })

  it('tiene clases base por defecto', () => {
    const { container } = render(<Card>X</Card>)
    expect(container.firstChild).toHaveClass('rounded-xl', 'bg-white')
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/ui/Button.test.tsx __tests__/components/ui/Card.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar Button**

```typescript
// components/ui/Button.tsx
'use client'

import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400 disabled:bg-gray-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}
```

- [ ] **Step 4: Implementar Card**

```typescript
// components/ui/Card.tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-sm border border-gray-100',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/ui/Button.test.tsx __tests__/components/ui/Card.test.tsx
```

Expected: `PASS` (8 tests verdes)

- [ ] **Step 6: Commit**

```bash
git add components/ui/Button.tsx components/ui/Card.tsx __tests__/components/ui/Button.test.tsx __tests__/components/ui/Card.test.tsx
git commit -m "feat: add Button and Card UI components"
```

---

## Tarea 7: Componente Modal + barrel export (TDD)

**Files:**
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/index.ts`
- Create: `__tests__/components/ui/Modal.test.tsx`

- [ ] **Step 1: Escribir test de Modal**

```typescript
// __tests__/components/ui/Modal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('no renderiza contenido cuando isOpen=false', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Contenido</Modal>)
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  it('renderiza contenido cuando isOpen=true', () => {
    render(<Modal isOpen onClose={() => {}}>Contenido</Modal>)
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('renderiza el título cuando se pasa', () => {
    render(<Modal isOpen onClose={() => {}} title="Mi título">X</Modal>)
    expect(screen.getByText('Mi título')).toBeInTheDocument()
  })

  it('llama onClose al hacer click en el overlay', async () => {
    const handleClose = jest.fn()
    render(<Modal isOpen onClose={handleClose}>Contenido</Modal>)
    await userEvent.click(screen.getByTestId('modal-overlay'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('llama onClose al presionar Escape', () => {
    const handleClose = jest.fn()
    render(<Modal isOpen onClose={handleClose}>Contenido</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npm test -- __tests__/components/ui/Modal.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar Modal**

```typescript
// components/ui/Modal.tsx
'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, className, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Correr test — debe pasar**

```bash
npm test -- __tests__/components/ui/Modal.test.tsx
```

Expected: `PASS` (5 tests verdes)

- [ ] **Step 5: Crear barrel export**

```typescript
// components/ui/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { Spinner } from './Spinner'
export { Modal } from './Modal'
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/Modal.tsx components/ui/index.ts __tests__/components/ui/Modal.test.tsx
git commit -m "feat: add Modal component and UI barrel export"
```

---

## Tarea 8: Scaffold páginas del buyer

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Create: `app/(buyer)/[eventId]/page.tsx`
- Create: `app/(buyer)/[eventId]/cart/page.tsx`
- Create: `app/(buyer)/[eventId]/checkout/page.tsx`
- Create: `app/(buyer)/[eventId]/order/[orderId]/page.tsx`
- Create: `app/(buyer)/[eventId]/qr/[orderId]/page.tsx`

- [ ] **Step 1: Limpiar globals.css**

Reemplazar todo el contenido de `app/globals.css` con:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Actualizar root layout**

Reemplazar `app/layout.tsx` con:

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nubapay',
  description: 'Pedí, pagá y retirá sin filas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Actualizar página raíz**

Reemplazar `app/page.tsx` con:

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Nubapay</h1>
      <p className="text-lg text-gray-600">Pedí, pagá y retirá sin filas</p>
    </main>
  )
}
```

- [ ] **Step 4: Crear página de catálogo**

```typescript
// app/(buyer)/[eventId]/page.tsx
import type { Metadata } from 'next'

interface CatalogPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { eventId } = await params
  return { title: `Catálogo — ${eventId}` }
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { eventId } = await params

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-gray-500">Evento: {eventId}</p>
      </header>
      {/* Lista de productos y combos */}
    </main>
  )
}
```

- [ ] **Step 5: Crear página de carrito**

```typescript
// app/(buyer)/[eventId]/cart/page.tsx
interface CartPageProps {
  params: Promise<{ eventId: string }>
}

export default async function CartPage({ params }: CartPageProps) {
  const { eventId } = await params

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Tu pedido</h1>
        <p className="text-sm text-gray-500">Evento: {eventId}</p>
      </header>
      {/* Items del carrito */}
    </main>
  )
}
```

- [ ] **Step 6: Crear página de checkout**

```typescript
// app/(buyer)/[eventId]/checkout/page.tsx
interface CheckoutPageProps {
  params: Promise<{ eventId: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Pago</h1>
        <p className="text-sm text-gray-500">Evento: {eventId}</p>
      </header>
      {/* Formulario de pago */}
    </main>
  )
}
```

- [ ] **Step 7: Crear página de seguimiento de pedido**

```typescript
// app/(buyer)/[eventId]/order/[orderId]/page.tsx
interface OrderPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params

  return (
    <main className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Estado de tu pedido</h1>
        <p className="text-sm text-gray-500">#{orderId}</p>
      </header>
      {/* Estado en tiempo real: pending → preparing → ready → delivered */}
    </main>
  )
}
```

- [ ] **Step 8: Crear página de QR**

```typescript
// app/(buyer)/[eventId]/qr/[orderId]/page.tsx
interface QRPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export default async function QRPage({ params }: QRPageProps) {
  const { orderId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold">Retirá tu pedido</h1>
      <p className="mt-1 text-sm text-gray-500">#{orderId}</p>
      {/* QR antifraude para presentar en el punto de entrega */}
    </main>
  )
}
```

- [ ] **Step 9: Verificar build**

```bash
npm run build
```

Expected: build exitoso sin errores de TypeScript ni de Next.js.

- [ ] **Step 10: Commit**

```bash
git add app/
git commit -m "feat: scaffold buyer pages (catalog, cart, checkout, order, qr)"
```

---

## Tarea 9: Scaffold páginas del organizador

**Files:**
- Create: `app/(organizer)/dashboard/page.tsx`
- Create: `app/(organizer)/orders/page.tsx`
- Create: `app/(organizer)/products/page.tsx`

- [ ] **Step 1: Crear dashboard**

```typescript
// app/(organizer)/dashboard/page.tsx
export default function OrganizerDashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Vista general del evento en tiempo real</p>
      </header>
      {/* Métricas: pedidos activos, ingresos, puntos de entrega */}
    </main>
  )
}
```

- [ ] **Step 2: Crear página de pedidos**

```typescript
// app/(organizer)/orders/page.tsx
export default function OrganizerOrdersPage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-gray-500">Gestión de pedidos en tiempo real</p>
      </header>
      {/* Lista de pedidos con estados y acciones */}
    </main>
  )
}
```

- [ ] **Step 3: Crear página de productos**

```typescript
// app/(organizer)/products/page.tsx
export default function OrganizerProductsPage() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="text-sm text-gray-500">Catálogo y combos del evento</p>
      </header>
      {/* CRUD de productos y combos */}
    </main>
  )
}
```

- [ ] **Step 4: Correr todos los tests**

```bash
npm test
```

Expected: todos los tests pasan.

- [ ] **Step 5: Verificar build final**

```bash
npm run build
```

Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add app/(organizer)/
git commit -m "feat: scaffold organizer pages (dashboard, orders, products)"
```
