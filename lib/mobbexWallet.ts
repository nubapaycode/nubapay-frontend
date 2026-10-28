/**
 * Mobbex Wallet (solo Sandbox): cliente de la API propia y carga de los SDK de Mobbex.
 *
 * Ni el número de tarjeta ni el CVV pasan por Nubapay: el CVV lo procesa `MobbexJS` en el
 * navegador y el alta de tarjetas nuevas ocurre dentro del checkout embebido de Mobbex.
 */
import { catalogPaths } from '@/lib/api/paths'
import { browserFetch } from '@/lib/browserFetch'

export type WalletInstallment = { reference: string; name: string; count?: number | null; total?: number | null }

export type WalletCard = {
  /** Medio guardado en la billetera de Mobbex. Se cobra contra el intent del checkout. */
  source_id?: string
  /** Intent de una tarjeta devuelta por el checkout viejo (`data.wallet[].it`). */
  intent_token?: string
  name: string
  brand: string
  last4: string
  exp_month?: number | string | null
  exp_year?: number | string | null
  installments: WalletInstallment[]
}

export type WalletCheckout = {
  checkout_id: string
  /** Intent de este pedido. El navegador lo usa para cobrar una tarjeta ya guardada, sin pasar el CVV por Nubapay. */
  intent_token: string
  embed_version: string
  email: string
  amount: number
  cards: WalletCard[]
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string; status: number }

const SESSION_KEY = 'nubapay_mobbex_wallet_session'
const MOBBEX_API = 'https://api.mobbex.com'
const MOBBEX_JS_URL = 'https://res.mobbex.com/js/sdk/mobbex@1.1.0.js'
const MOBBEX_EMBED_URL = 'https://api.mobbex.com/p/embed/1.2.0/lib.js'

const APPROVED = new Set(['200', '201', '300', '301', '302'])

async function call<T>(url: string, init: RequestInit & { session?: string | null } = {}): Promise<Result<T>> {
  const { session, ...rest } = init
  try {
    const res = await browserFetch(url, {
      method: 'POST',
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'X-Branded-Host': window.location.host,
        ...(session ? { 'X-Wallet-Session': session } : {}),
        ...rest.headers,
      },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: body.error ?? 'Algo salió mal. Intentá de nuevo.', status: res.status }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, error: 'Error de conexión. Verificá tu internet.', status: 0 }
  }
}

/** `orderId` es opcional: con él el mail del código sale con la marca del evento. */
export const requestWalletCode = (email: string, orderId?: string) =>
  call<{ ok: boolean; cooldown: number }>(catalogPaths.mobbexWalletCode(), {
    body: JSON.stringify({ email, order_id: orderId }),
  })

export const verifyWalletCode = (email: string, code: string) =>
  call<{ session_token: string; expires_in: number; email: string }>(catalogPaths.mobbexWalletVerify(), {
    body: JSON.stringify({ email, code }),
  })

export const createWalletCheckout = (orderId: string, session: string, slug?: string) =>
  call<WalletCheckout | { status: 'approved' }>(catalogPaths.mobbexWalletCheckout(orderId, slug), { session })

export const syncWalletPayment = (orderId: string) =>
  call<{ status: 'approved' | 'rejected' | 'pending' }>(catalogPaths.mobbexWalletSync(orderId))

/** Cobra una tarjeta ya guardada. El CVV va directo a Mobbex, no al backend de Nubapay. */
export async function paySavedCard(opts: {
  intentToken: string
  sourceId: string
  installment: string
  securityCode: string
}): Promise<MobbexProcessResult> {
  const res = await browserFetch(`${MOBBEX_API}/p/operations/${encodeURIComponent(opts.intentToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      it: opts.intentToken,
      source: opts.sourceId,
      installment: opts.installment || '1',
      securityCode: opts.securityCode,
      wallet: false,
    }),
  })
  const body = (await res.json().catch(() => ({}))) as MobbexProcessResult
  if (!res.ok) {
    return { result: false, error: body.error || 'Mobbex rechazó el pago. Intentá de nuevo.', data: body.data }
  }
  const code = String(body.data?.status?.code ?? '')
  if (body.result && code && !APPROVED.has(code)) {
    return { result: false, error: body.data?.status?.message || 'El pago fue rechazado.', data: body.data }
  }
  return body
}

/** La sesión vive en localStorage: el email verificado se recuerda en este dispositivo hasta que vence en el servidor (24 h). */
export function loadWalletSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number }
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

export function saveWalletSession(token: string, expiresInSeconds: number): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }))
  } catch {
    // sin storage: el comprador tendrá que verificar de nuevo en la próxima carga
  }
}

export function clearWalletSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // noop
  }
}

// --- SDK de Mobbex -----------------------------------------------------------------

export type MobbexProcessResult = {
  result?: boolean
  error?: string
  data?: { status?: { code?: string | number; text?: string; message?: string } }
}

type MobbexEmbedInstance = {
  open: (opts: { type: 'checkout'; id: string; paymentMethod?: string }) => void
  close: () => void
}

declare global {
  interface Window {
    MobbexJS?: {
      operation: {
        process: (opts: { intentToken: string; installment: string; securityCode: string }) => Promise<MobbexProcessResult>
      }
    }
    MobbexEmbed?: {
      init: (opts: {
        onResult?: (data: unknown) => void
        onPayment?: (data: unknown) => void
        onOpen?: () => void
        onClose?: (cancelled: boolean) => void
        onError?: (error: unknown) => void
      }) => MobbexEmbedInstance
    }
  }
}

const scripts = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  const cached = scripts.get(src)
  if (cached) return cached
  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      scripts.delete(src)
      reject(new Error(`No se pudo cargar ${src}`))
    }
    document.head.appendChild(el)
  })
  scripts.set(src, promise)
  return promise
}

export async function loadMobbexJs() {
  await loadScript(MOBBEX_JS_URL)
  if (!window.MobbexJS) throw new Error('MobbexJS no disponible')
  return window.MobbexJS
}

export async function loadMobbexEmbed() {
  await loadScript(MOBBEX_EMBED_URL)
  if (!window.MobbexEmbed) throw new Error('MobbexEmbed no disponible')
  return window.MobbexEmbed
}
