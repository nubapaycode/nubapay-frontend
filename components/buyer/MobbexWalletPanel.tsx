'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { BUYER_COLORS } from '@/lib/buyerUi'
import {
  clearWalletSession,
  createWalletCheckout,
  loadMobbexEmbed,
  loadMobbexJs,
  loadWalletSession,
  requestWalletCode,
  saveWalletSession,
  syncWalletPayment,
  verifyWalletCode,
  type WalletCard,
  type WalletCheckout,
} from '@/lib/mobbexWallet'
import { formatPrice } from '@/lib/utils'

type Step = 'email' | 'code' | 'loading' | 'cards' | 'confirming'

const ACCENT = '#6D28D9'
const SYNC_ATTEMPTS = 8
const SYNC_DELAY_MS = 2000

const TEST_CARDS = [
  ['Visa crédito', '4507 9831 9008 2450'],
  ['Mastercard crédito', '5323 6299 9312 1008'],
  ['Visa débito', '4507 9900 0000 0010'],
]

const inputClass =
  'w-full rounded-[14px] border px-4 py-3.5 text-[15px] outline-none transition-shadow focus:ring-2'
const primaryButton =
  'flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-bold text-white transition-opacity disabled:opacity-50'

function expiry(card: WalletCard): string {
  if (!card.exp_month || !card.exp_year) return ''
  const year = String(card.exp_year).slice(-2)
  return `Vence ${String(card.exp_month).padStart(2, '0')}/${year}`
}

/**
 * Pago embebido con Mobbex Wallet (Sandbox). El comprador verifica su email con un código,
 * ve sus tarjetas guardadas en Mobbex y paga con una (solo CVV) o carga una nueva en el
 * checkout embebido de Mobbex. Nunca hay redirecciones: todo ocurre dentro de la página.
 */
export function MobbexWalletPanel({
  orderId,
  catalogSlug,
  initialEmail,
  amount,
  onSettled,
}: {
  orderId: string
  catalogSlug?: string
  initialEmail?: string | null
  amount: number
  /** Se llama cuando el pedido pudo quedar pagado: el padre vuelve a leer el estado. */
  onSettled: () => void
}) {
  // Con una sesión verificada en esta pestaña se carga directo; si no, se empieza por el email.
  const [step, setStep] = useState<Step>(() => (loadWalletSession() ? 'loading' : 'email'))
  const [email, setEmail] = useState(initialEmail ?? '')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [checkout, setCheckout] = useState<WalletCheckout | null>(null)
  const [selected, setSelected] = useState(0)
  const [installment, setInstallment] = useState('')
  const [cvv, setCvv] = useState('')
  const alive = useRef(true)
  const settledRef = useRef(onSettled)
  useEffect(() => {
    settledRef.current = onSettled
  })

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const applyCheckout = useCallback((res: Awaited<ReturnType<typeof createWalletCheckout>>) => {
    if (!alive.current) return
    if (!res.ok) {
      if (res.status === 401) {
        clearWalletSession()
      } else {
        setError(res.error)
      }
      setStep('email')
      return
    }
    if ('status' in res.data) {
      settledRef.current()
      return
    }
    setCheckout(res.data)
    setEmail(res.data.email)
    setSelected(0)
    setCvv('')
    setInstallment(res.data.cards[0]?.installments[0]?.reference ?? '')
    setStep('cards')
  }, [])

  const loadCards = useCallback(
    async (session: string) => {
      setStep('loading')
      setError('')
      applyCheckout(await createWalletCheckout(orderId, session, catalogSlug))
    },
    [applyCheckout, orderId, catalogSlug],
  )

  // Si ya verificó hace poco en esta pestaña, no se le vuelve a pedir el código.
  useEffect(() => {
    const session = loadWalletSession()
    if (session) void createWalletCheckout(orderId, session, catalogSlug).then(applyCheckout)
  }, [applyCheckout, orderId, catalogSlug])

  const sendCode = async () => {
    setBusy(true)
    setError('')
    const res = await requestWalletCode(email.trim())
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setCode('')
    setCooldown(res.data.cooldown)
    setStep('code')
  }

  const submitCode = async () => {
    setBusy(true)
    setError('')
    const res = await verifyWalletCode(email.trim(), code.trim())
    if (!res.ok) {
      setBusy(false)
      setError(res.error)
      return
    }
    saveWalletSession(res.data.session_token, res.data.expires_in)
    setBusy(false)
    await loadCards(res.data.session_token)
  }

  /** Mobbex avisa por webhook; acá se concilia contra su API sin depender de él. */
  const confirmPayment = useCallback(async () => {
    setStep('confirming')
    setError('')
    for (let i = 0; i < SYNC_ATTEMPTS; i++) {
      const res = await syncWalletPayment(orderId)
      if (!alive.current) return
      if (res.ok && res.data.status === 'approved') {
        settledRef.current()
        return
      }
      if (res.ok && res.data.status === 'rejected') {
        setError('El pago fue rechazado. Probá con otra tarjeta.')
        const session = loadWalletSession()
        if (session) await loadCards(session)
        else setStep('email')
        return
      }
      await new Promise(r => setTimeout(r, SYNC_DELAY_MS))
    }
    setNotice('Seguimos confirmando tu pago. Esta página se actualiza sola.')
    settledRef.current()
  }, [orderId, loadCards])

  const payWithCard = async () => {
    const card = checkout?.cards[selected]
    if (!card) return
    if (!/^\d{3,4}$/.test(cvv)) {
      setError('Ingresá el código de seguridad de tu tarjeta.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const mobbex = await loadMobbexJs()
      const result = await mobbex.operation.process({
        intentToken: card.intent_token,
        installment: installment || card.installments[0]?.reference || '',
        securityCode: cvv,
      })
      setCvv('')
      if (!result?.result) {
        setError(result?.error || result?.data?.status?.message || 'No se pudo procesar el pago. Probá con otra tarjeta.')
        setBusy(false)
        return
      }
      setBusy(false)
      await confirmPayment()
    } catch {
      setCvv('')
      setBusy(false)
      setError('No se pudo conectar con Mobbex. Intentá de nuevo.')
    }
  }

  /** Checkout embebido de Mobbex: ahí se carga una tarjeta nueva y se guarda en la billetera. */
  const openEmbedded = async () => {
    if (!checkout) return
    setError('')
    try {
      const embedApi = await loadMobbexEmbed()
      const embed = embedApi.init({
        onResult: () => embed.close(),
        onClose: () => {
          void confirmPayment()
        },
        onError: () => setError('No se pudo abrir el checkout. Intentá de nuevo.'),
      })
      embed.open({ type: 'checkout', id: checkout.checkout_id })
    } catch {
      setError('No se pudo cargar el checkout de Mobbex. Intentá de nuevo.')
    }
  }

  const changeEmail = () => {
    clearWalletSession()
    setCheckout(null)
    setError('')
    setStep('email')
  }

  const card = checkout?.cards[selected]

  return (
    <div className="flex flex-col gap-4" style={{ color: BUYER_COLORS.text }}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(109,40,217,0.1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <p className="text-[14px] font-bold">Mobbex Wallet</p>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: '#FEF3C7', color: '#92400E' }}
        >
          Modo prueba
        </span>
      </div>

      {step === 'loading' && (
        <div className="flex items-center justify-center gap-2.5 py-6 text-[13px]" style={{ color: BUYER_COLORS.muted }}>
          <Spinner size="sm" /> Cargando…
        </div>
      )}

      {step === 'email' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={e => {
            e.preventDefault()
            void sendCode()
          }}
        >
          <p className="text-[13px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
            Ingresá tu email y te mandamos un código para ver tus tarjetas guardadas o guardar una nueva. Las
            tarjetas quedan en Mobbex, no en Nubapay.
          </p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            style={{ borderColor: BUYER_COLORS.border, background: BUYER_COLORS.subtleFill }}
            aria-label="Email"
          />
          <button type="submit" disabled={busy || !email.includes('@')} className={primaryButton} style={{ background: ACCENT }}>
            {busy ? <Spinner size="sm" className="text-white" /> : null}
            Enviarme el código
          </button>
        </form>
      )}

      {step === 'code' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={e => {
            e.preventDefault()
            void submitCode()
          }}
        >
          <p className="text-[13px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
            Mandamos un código de 6 dígitos a <b style={{ color: BUYER_COLORS.text }}>{email}</b>.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${inputClass} text-center text-[24px] font-bold tracking-[0.4em]`}
            style={{ borderColor: BUYER_COLORS.border, background: BUYER_COLORS.subtleFill }}
            aria-label="Código de verificación"
          />
          <button type="submit" disabled={busy || code.length !== 6} className={primaryButton} style={{ background: ACCENT }}>
            {busy ? <Spinner size="sm" className="text-white" /> : null}
            Verificar
          </button>
          <div className="flex items-center justify-between text-[12px]" style={{ color: BUYER_COLORS.muted }}>
            <button type="button" onClick={changeEmail} className="underline">
              Cambiar email
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy || cooldown > 0}
              className="underline disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      )}

      {step === 'confirming' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Spinner size="md" />
          <p className="text-[14px] font-semibold">Confirmando tu pago…</p>
          <p className="text-[12px]" style={{ color: BUYER_COLORS.muted }}>
            No cierres esta página.
          </p>
        </div>
      )}

      {step === 'cards' && checkout && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-[12px]" style={{ color: BUYER_COLORS.muted }}>
            <span className="truncate">
              Verificado: <b style={{ color: BUYER_COLORS.text }}>{checkout.email}</b>
            </span>
            <button type="button" onClick={changeEmail} className="shrink-0 underline">
              Cambiar
            </button>
          </div>

          {checkout.cards.length > 0 ? (
            <>
              <p className="text-[13px] font-semibold">Tus tarjetas guardadas</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Tarjetas guardadas">
                {checkout.cards.map((c, i) => {
                  const active = i === selected
                  return (
                    <button
                      key={c.intent_token}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setSelected(i)
                        setInstallment(c.installments[0]?.reference ?? '')
                        setCvv('')
                      }}
                      className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-colors"
                      style={{
                        border: active ? `2px solid ${ACCENT}` : `1.5px solid ${BUYER_COLORS.border}`,
                        background: active ? 'rgba(109,40,217,0.04)' : '#fff',
                      }}
                    >
                      <span className="flex h-9 w-12 items-center justify-center rounded-[8px] text-[10px] font-bold uppercase" style={{ background: BUYER_COLORS.subtleFill }}>
                        {c.brand.slice(0, 6) || 'Tarjeta'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold">
                          {c.brand || 'Tarjeta'} •••• {c.last4}
                        </span>
                        <span className="block text-[12px]" style={{ color: BUYER_COLORS.muted }}>
                          {expiry(c)}
                        </span>
                      </span>
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                        style={{ borderColor: active ? ACCENT : 'rgba(0,0,0,0.2)' }}
                        aria-hidden
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: ACCENT }} />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {card && card.installments.length > 1 && (
                <select
                  value={installment}
                  onChange={e => setInstallment(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: BUYER_COLORS.border, background: BUYER_COLORS.subtleFill }}
                  aria-label="Cuotas"
                >
                  {card.installments.map(inst => (
                    <option key={inst.reference} value={inst.reference}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                placeholder="Código de seguridad (CVV)"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                className={inputClass}
                style={{ borderColor: BUYER_COLORS.border, background: BUYER_COLORS.subtleFill }}
                aria-label="Código de seguridad"
              />
              <button type="button" onClick={() => void payWithCard()} disabled={busy} className={primaryButton} style={{ background: ACCENT }}>
                {busy ? <Spinner size="sm" className="text-white" /> : null}
                Pagar {formatPrice(checkout.amount || amount)}
              </button>
              <p className="text-center text-[11px]" style={{ color: BUYER_COLORS.muted }}>
                El código de seguridad lo procesa Mobbex. Nunca lo guardamos.
              </p>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: BUYER_COLORS.muted }}>
                <span className="h-px flex-1" style={{ background: BUYER_COLORS.border }} />o<span className="h-px flex-1" style={{ background: BUYER_COLORS.border }} />
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
              Todavía no tenés tarjetas guardadas con este email. Pagá con una tarjeta nueva y quedará guardada en
              tu billetera de Mobbex para la próxima compra.
            </p>
          )}

          <button
            type="button"
            onClick={() => void openEmbedded()}
            className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold transition-opacity active:opacity-80"
            style={
              checkout.cards.length > 0
                ? { border: `1.5px solid ${BUYER_COLORS.border}`, background: '#fff', color: BUYER_COLORS.text }
                : { background: ACCENT, color: '#fff' }
            }
          >
            {checkout.cards.length > 0 ? 'Usar otra tarjeta' : `Pagar ${formatPrice(checkout.amount || amount)} con una tarjeta nueva`}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13px] font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {notice && (
        <p className="text-[12px]" style={{ color: BUYER_COLORS.muted }}>
          {notice}
        </p>
      )}

      <details className="rounded-[12px] px-3 py-2 text-[11px]" style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.muted }}>
        <summary className="cursor-pointer font-semibold">Tarjetas de prueba (Sandbox)</summary>
        <ul className="mt-2 flex flex-col gap-0.5">
          {TEST_CARDS.map(([name, number]) => (
            <li key={number}>
              {name}: <span className="font-mono">{number}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Vencimiento 12/34 · Nombre Demo · DNI 12123123. CVV <b>200</b> aprueba, <b>400</b> rechaza, <b>002</b> queda en espera.
        </p>
      </details>

      {/* Contenedor que usa el SDK embebido de Mobbex para su modal. */}
      <div id="mbbx-container" />
    </div>
  )
}
