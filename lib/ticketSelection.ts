'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Selección de entradas de `/tickets/:slug`. Es independiente del carrito del catálogo:
 * las entradas se compran solas, con su propio checkout y una reserva de tiempo.
 * Vive en sessionStorage, igual que el carrito.
 */

const KEY = 'nubapay_ticket_selection'

/** Tiempo para completar la compra desde que se toca "Comprar". */
export const TICKET_HOLD_MS = 10 * 60 * 1000

export interface TicketSelectionLine {
  ticketId: string
  quantity: number
}

interface StoredSelection {
  slug: string
  lines: TicketSelectionLine[]
  /** Epoch ms en que vence el tiempo para pagar; se fija al tocar "Comprar". */
  expiresAt?: number
}

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedValue: StoredSelection | null = null

function readStored(): StoredSelection | null {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
  } catch {
    return null
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? (JSON.parse(raw) as StoredSelection) : null
  } catch {
    cachedValue = null
  }
  return cachedValue
}

function writeStored(value: StoredSelection | null) {
  try {
    if (!value || value.lines.length === 0) sessionStorage.removeItem(KEY)
    else sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // sin storage (modo privado estricto): la selección no persiste entre páginas
  }
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Marca el inicio de los 10 minutos para pagar. Devuelve el vencimiento. */
export function startTicketHold(slug: string, now = Date.now()): number {
  const stored = readStored()
  const expiresAt = now + TICKET_HOLD_MS
  if (stored?.slug === slug) writeStored({ ...stored, expiresAt })
  return expiresAt
}

export function clearTicketSelection() {
  writeStored(null)
}

interface UseTicketSelection {
  /** false durante el render del servidor y la hidratación. */
  ready: boolean
  lines: TicketSelectionLine[]
  expiresAt: number | null
  quantityOf: (ticketId: string) => number
  setQuantity: (ticketId: string, quantity: number) => void
}

const EMPTY: TicketSelectionLine[] = []

export function useTicketSelection(slug: string): UseTicketSelection {
  const stored = useSyncExternalStore(subscribe, readStored, () => undefined)
  const ready = stored !== undefined
  const own = stored && stored.slug === slug ? stored : null
  const lines = own?.lines ?? EMPTY

  const setQuantity = useCallback(
    (ticketId: string, quantity: number) => {
      const current = readStored()
      const base = current?.slug === slug ? current.lines : []
      const next = base.filter(l => l.ticketId !== ticketId)
      if (quantity > 0) {
        const index = base.findIndex(l => l.ticketId === ticketId)
        next.splice(index === -1 ? next.length : index, 0, { ticketId, quantity })
      }
      // Cambiar la selección invalida el tiempo reservado: se vuelve a fijar al tocar "Comprar".
      writeStored({ slug, lines: next })
    },
    [slug],
  )

  const quantityOf = useCallback((ticketId: string) => lines.find(l => l.ticketId === ticketId)?.quantity ?? 0, [lines])

  return { ready, lines, expiresAt: own?.expiresAt ?? null, quantityOf, setQuantity }
}
