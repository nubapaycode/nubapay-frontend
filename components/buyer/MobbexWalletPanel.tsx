'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { Spinner } from '@/components/ui/Spinner'
import { BUYER_COLORS } from '@/lib/buyerUi'
import {
  clearWalletSession,
  createWalletCheckout,
  loadMobbexEmbed,
  loadMobbexJs,
  loadWalletSession,
  paySavedCard,
  requestWalletCode,
  saveWalletSession,
  syncWalletPayment,
  verifyWalletCode,
  type WalletCard,
  type WalletCheckout,
} from '@/lib/mobbexWallet'
import { formatPrice } from '@/lib/utils'

type Step = 'email' | 'code' | 'loading' | 'cards' | 'confirming'

const SYNC_ATTEMPTS = 8
const SYNC_DELAY_MS = 2000
const APPROVED_STATUS = new Set(['200', '201', '300', '301', '302'])

function paymentStatusCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as { data?: { status?: { code?: unknown } }; status?: { code?: unknown }; code?: unknown }
  const code = body.data?.status?.code ?? body.status?.code ?? body.code
  if (code == null || code === '') return null
  return String(code)
}

type CodeResult = Awaited<ReturnType<typeof requestWalletCode>>

/** Una sola petición por pedido y email, también si React monta el panel dos veces. */
const codeSends = new Map<string, Promise<CodeResult>>()

function requestCodeOnce(orderId: string, email: string): Promise<CodeResult> {
  const key = `${orderId}:${email.toLowerCase()}`
  const existing = codeSends.get(key)
  if (existing) return existing
  const pending = requestWalletCode(email, orderId).then(res => {
    if (!res.ok) codeSends.delete(key)
    return res
  })
  codeSends.set(key, pending)
  return pending
}

export function clearAutoSentWalletCodes() {
  codeSends.clear()
}

function knownEmail(value?: string | null): string {
  const next = value?.trim() ?? ''
  return next.includes('@') ? next : ''
}

function asPx(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+(?:\.\d+)?)px?$/)
    if (match) return Number(match[1])
  }
  return null
}

/** Alto del formulario que manda el iframe. Ignora el marco por defecto de 640×750. */
function embedHeightFromMessage(data: unknown): number | null {
  let found: number | null = null
  const walk = (value: unknown, depth: number) => {
    if (found || depth > 8 || value == null) return
    if (typeof value === 'string') {
      if (value.includes('height')) {
        try {
          walk(JSON.parse(value), depth + 1)
        } catch {
          /* no es JSON */
        }
      }
      return
    }
    if (typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(item => walk(item, depth + 1))
      return
    }
    const record = value as Record<string, unknown>
    const width = asPx(record.width)
    const height = asPx(record.height)
    const isDefaultFrame = width === 640 && height === 750
    if (height != null && width != null && !isDefaultFrame && height >= 180 && height <= EMBED_MAX_HEIGHT && width >= 200 && width <= 1600) {
      found = height
      return
    }
    Object.values(record).forEach(item => walk(item, depth + 1))
  }
  walk(data, 0)
  return found
}

/** El SDK también crea iframes auxiliares ocultos (prerender, detección de cierre): solo se toca el del formulario. */
const REAL_FRAME = 'iframe[name^="__zoid__"]'
const EMBED_MIN_HEIGHT = 732
const EMBED_MAX_HEIGHT = 1400
/** Franja en blanco de arriba del formulario de Mobbex (su contenedor lo baja 80px): se recorta subiendo el iframe. */
const EMBED_CROP_TOP = 80

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
 * Pago con tarjetas guardadas. El comprador verifica su email con un código,
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
  // Con una sesión verificada se cargan las tarjetas. Si ya hay email, el código sale solo.
  const [step, setStep] = useState<Step>(() => {
    if (loadWalletSession()) return 'loading'
    return knownEmail(initialEmail) ? 'loading' : 'email'
  })
  const [email, setEmail] = useState(initialEmail?.trim() ?? '')
  const [sendingCode, setSendingCode] = useState(() => !loadWalletSession() && Boolean(knownEmail(initialEmail)))
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
  const sessionRef = useRef<string | null>(null)
  const paidInEmbedRef = useRef(false)
  const confirmGen = useRef(0)
  const embedRef = useRef<{ close: () => void } | null>(null)
  const embedHeightRef = useRef<number | null>(null)
  const embedFitStop = useRef<(() => void) | null>(null)
  const embedSlot = useRef<HTMLDivElement>(null)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [embedLoading, setEmbedLoading] = useState(false)
  const settledRef = useRef(onSettled)
  useEffect(() => {
    settledRef.current = onSettled
  })

  useEffect(() => {
    const next = initialEmail?.trim() ?? ''
    if (next) setEmail(current => (current.trim() ? current : next))
    const address = knownEmail(next)
    if (!address || loadWalletSession()) return
    setSendingCode(true)
    setStep(current => (current === 'email' ? 'loading' : current))
    void requestCodeOnce(orderId, address).then(res => {
      if (!alive.current) return
      setSendingCode(false)
      if (!res.ok) {
        setError(res.error)
        setStep('email')
        return
      }
      setCode('')
      setCooldown(res.data.cooldown)
      setStep(current => (current === 'loading' || current === 'email' ? 'code' : current))
    })
  }, [initialEmail, orderId])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      embedFitStop.current?.()
      embedFitStop.current = null
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
        sessionRef.current = null
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
    if (session) {
      sessionRef.current = session
      void createWalletCheckout(orderId, session, catalogSlug).then(applyCheckout)
    }
  }, [applyCheckout, orderId, catalogSlug])

  const sendCode = async () => {
    setBusy(true)
    setError('')
    const res = await requestWalletCode(email.trim(), orderId)
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
    sessionRef.current = res.data.session_token
    setBusy(false)
    await loadCards(res.data.session_token)
  }

  /** Mobbex avisa por webhook; acá se concilia contra su API sin depender de él. */
  const confirmPayment = useCallback(async () => {
    const gen = ++confirmGen.current
    setStep('confirming')
    setError('')
    for (let i = 0; i < SYNC_ATTEMPTS; i++) {
      const res = await syncWalletPayment(orderId)
      if (!alive.current || confirmGen.current !== gen) return
      if (res.ok && res.data.status === 'approved') {
        settledRef.current()
        return
      }
      if (res.ok && res.data.status === 'rejected') {
        if (confirmGen.current !== gen) return
        setError('El pago fue rechazado. Probá con otra tarjeta.')
        const session = loadWalletSession()
        if (session) await loadCards(session)
        else setStep('email')
        return
      }
      await new Promise(r => setTimeout(r, SYNC_DELAY_MS))
    }
    if (confirmGen.current !== gen) return
    setNotice('Seguimos confirmando tu pago. Esta página se actualiza sola.')
    settledRef.current()
  }, [orderId, loadCards])

  const payWithCard = async () => {
    const current = checkout
    const card = current?.cards[selected]
    if (!current || !card) return
    if (!/^\d{3,4}$/.test(cvv)) {
      setError('Ingresá el código de seguridad de tu tarjeta.')
      return
    }
    const securityCode = cvv
    setBusy(true)
    setError('')
    try {
      const plan = installment || card.installments[0]?.reference || '1'
      let intentToken = current.intent_token
      let sourceId = card.source_id
      if (card.source_id) {
        const session = sessionRef.current || loadWalletSession()
        if (!session) {
          setError('La verificación venció. Ingresá tu email de nuevo.')
          setStep('email')
          setBusy(false)
          return
        }
        const fresh = await createWalletCheckout(orderId, session, catalogSlug)
        if (!alive.current) return
        if (!fresh.ok || !('cards' in fresh.data)) {
          applyCheckout(fresh)
          setBusy(false)
          return
        }
        const nextCard = fresh.data.cards.find(item => item.source_id === card.source_id) ?? fresh.data.cards[selected]
        if (!fresh.data.intent_token || !nextCard?.source_id) {
          setCheckout(fresh.data)
          setError('No encontramos esa tarjeta. Elegí otra o pagá con una nueva.')
          setBusy(false)
          return
        }
        setCheckout(fresh.data)
        intentToken = fresh.data.intent_token
        sourceId = nextCard.source_id
      }
      const result = sourceId
        ? await paySavedCard({
            intentToken,
            sourceId,
            installment: plan,
            securityCode,
          })
        : await (await loadMobbexJs()).operation.process({
            intentToken: card.intent_token || '',
            installment: plan,
            securityCode,
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

  const closeEmbed = () => {
    confirmGen.current += 1
    paidInEmbedRef.current = false
    embedRef.current = null
    embedHeightRef.current = null
    embedFitStop.current?.()
    embedFitStop.current = null
    setEmbedOpen(false)
    setNotice('')
    setStep(current => (current === 'confirming' ? 'cards' : current))
    document.getElementById('mbbx-container')?.replaceChildren()
  }

  const backToCards = () => {
    paidInEmbedRef.current = false
    const embed = embedRef.current
    if (!embed) {
      closeEmbed()
      return
    }
    try {
      embed.close()
    } catch {
      closeEmbed()
    }
  }

  /**
   * El marco de Mobbex nace en 750px y centrado. Lo pegamos al formulario y le sacamos la X.
   * Nunca baja de 732px: el alto que informa Mobbex es para su ancho de escritorio y en un panel
   * angosto el formulario queda más alto, con lo que aparecería un scroll interno.
   */
  const applyEmbedHeight = (reported: number) => {
    if (!Number.isFinite(reported) || reported < 180 || reported > EMBED_MAX_HEIGHT) return
    const height = Math.max(reported, EMBED_MIN_HEIGHT)
    embedHeightRef.current = height
    const content = document.getElementById('mbbx-container')?.querySelector<HTMLElement>('[class*="-content"]')
    if (!content) return
    const px = `${Math.ceil(height)}px`
    content.style.setProperty('height', px, 'important')
    content.style.setProperty('min-height', px, 'important')
    content.style.setProperty('max-height', px, 'important')
  }

  const pinEmbed = () => {
    const root = document.getElementById('mbbx-container')
    if (!root) return
    root.style.setProperty('position', 'relative', 'important')
    root.style.setProperty('top', '0', 'important')
    root.style.setProperty('height', 'auto', 'important')
    root.style.setProperty('min-height', '0', 'important')
    root.querySelectorAll<HTMLElement>('[class*="-close"], [class*="-prerender"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important')
      el.style.setProperty('height', '0', 'important')
      el.style.setProperty('width', '0', 'important')
      el.style.setProperty('min-height', '0', 'important')
      el.style.setProperty('visibility', 'hidden', 'important')
      el.style.setProperty('overflow', 'hidden', 'important')
    })
    root.querySelectorAll<HTMLElement>('[class*="-container"], [class*="-content"]').forEach(el => {
      el.style.setProperty('position', 'relative', 'important')
      el.style.setProperty('top', '0', 'important')
      el.style.setProperty('left', '0', 'important')
      el.style.setProperty('transform', 'none', 'important')
      el.style.setProperty('margin', '0', 'important')
      el.style.setProperty('width', '100%', 'important')
      el.style.setProperty('max-width', '100%', 'important')
    })
    const content = root.querySelector<HTMLElement>('[class*="-content"]')
    if (content) applyEmbedHeight(embedHeightRef.current ?? EMBED_MIN_HEIGHT)
    const iframe = root.querySelector<HTMLIFrameElement>(REAL_FRAME)
    if (!iframe) return
    iframe.style.setProperty('position', 'absolute', 'important')
    iframe.style.setProperty('display', 'block', 'important')
    iframe.style.setProperty('top', `-${EMBED_CROP_TOP}px`, 'important')
    iframe.style.setProperty('left', '0', 'important')
    iframe.style.setProperty('right', '0', 'important')
    iframe.style.setProperty('bottom', '0', 'important')
    iframe.style.setProperty('margin', '0', 'important')
    iframe.style.setProperty('width', '100%', 'important')
    iframe.style.setProperty('height', `calc(100% + ${EMBED_CROP_TOP}px)`, 'important')
    iframe.style.setProperty('border', '0', 'important')
    iframe.setAttribute('scrolling', 'no')
  }

  /** El SDK de Mobbex abre un modal fijo. Lo montamos en el panel y pisamos ese overlay para que quede en la página. */
  const openEmbedded = async () => {
    if (!checkout) return
    setError('')
    paidInEmbedRef.current = false
    flushSync(() => {
      setEmbedOpen(true)
      setEmbedLoading(true)
    })
    const stopLoading = window.setTimeout(() => setEmbedLoading(false), 6000)
    try {
      const embedApi = await loadMobbexEmbed()
      const embed = embedApi.init({
        onResult: (data: unknown) => {
          const code = paymentStatusCode(data)
          if (!code || !APPROVED_STATUS.has(code)) return
          paidInEmbedRef.current = true
          setEmbedOpen(false)
          void confirmPayment()
          embed.close()
        },
        onOpen: () => setEmbedLoading(false),
        onClose: () => {
          setEmbedLoading(false)
          if (paidInEmbedRef.current) return
          closeEmbed()
        },
        onError: () => setError('No se pudo abrir el checkout. Intentá de nuevo.'),
      })
      embedRef.current = embed
      embedHeightRef.current = null
      embedFitStop.current?.()
      const onMessage = (event: MessageEvent) => {
        const frame = document.getElementById('mbbx-container')?.querySelector<HTMLIFrameElement>(REAL_FRAME)
        const fromFrame = Boolean(frame && event.source === frame.contentWindow)
        const fromMobbex = String(event.origin || '').includes('mobbex.com')
        if (!fromFrame && !fromMobbex) return
        const height = embedHeightFromMessage(event.data)
        if (height) applyEmbedHeight(height)
      }
      window.addEventListener('message', onMessage)
      embedFitStop.current = () => window.removeEventListener('message', onMessage)
      embed.open({ type: 'checkout', id: checkout.checkout_id })
      pinEmbed()
      embedSlot.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
      const pullSdkHeight = window.setInterval(() => {
        const content = document.getElementById('mbbx-container')?.querySelector<HTMLElement>('[class*="-content"]')
        const inline = asPx(content?.style.height ?? '')
        const isDefaultFrame = inline === 750
        if (inline && !isDefaultFrame) applyEmbedHeight(inline)
      }, 200)
      window.setTimeout(() => window.clearInterval(pullSdkHeight), 8000)
      const stopFit = embedFitStop.current
      embedFitStop.current = () => {
        window.clearInterval(pullSdkHeight)
        stopFit?.()
      }
      window.setTimeout(pinEmbed, 50)
      window.setTimeout(pinEmbed, 300)
      window.setTimeout(pinEmbed, 800)
    } catch {
      window.clearTimeout(stopLoading)
      setEmbedOpen(false)
      setEmbedLoading(false)
      setError('No se pudo cargar el checkout de Mobbex. Intentá de nuevo.')
    }
  }

  // El script de Mobbex se baja apenas se ven las tarjetas, así "Usar otra tarjeta" abre sin esperar la descarga.
  useEffect(() => {
    if (step === 'cards') void Promise.resolve(loadMobbexEmbed()).catch(() => undefined)
  }, [step])

  const changeEmail = () => {
    sessionRef.current = null
    clearWalletSession()
    setCheckout(null)
    setError('')
    setStep('email')
  }

  const card = checkout?.cards[selected]

  return (
    <div className="flex flex-col gap-4" style={{ color: BUYER_COLORS.text }}>
      {step === 'loading' && (
        <div className="flex items-center justify-center gap-2.5 py-6 text-[13px]" style={{ color: BUYER_COLORS.muted }}>
          <Spinner size="sm" /> {sendingCode ? 'Enviando el código…' : 'Cargando…'}
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
            Te mandamos un código para confirmar el pago. Si ya pagaste con este email, vas a ver tus tarjetas.
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
          <button type="submit" disabled={busy || !email.includes('@')} className={primaryButton} style={{ background: BUYER_COLORS.text }}>
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
          <button type="submit" disabled={busy || code.length !== 6} className={primaryButton} style={{ background: BUYER_COLORS.text }}>
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
          {notice && (
            <p className="max-w-[260px] text-[12px]" style={{ color: BUYER_COLORS.muted }}>
              {notice}
            </p>
          )}
        </div>
      )}

      {step === 'cards' && checkout && (
        <div className={embedOpen ? 'flex flex-col gap-1' : 'flex flex-col gap-3'}>
          {!embedOpen && (
          <>
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
                      key={c.source_id || c.intent_token}
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
                        border: active ? `2px solid ${BUYER_COLORS.text}` : `1.5px solid ${BUYER_COLORS.border}`,
                        background: active ? BUYER_COLORS.subtleFill : '#fff',
                      }}
                    >
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
                        style={{ borderColor: active ? BUYER_COLORS.text : 'rgba(0,0,0,0.2)' }}
                        aria-hidden
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUYER_COLORS.text }} />}
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
              <button type="button" onClick={() => void payWithCard()} disabled={busy} className={primaryButton} style={{ background: BUYER_COLORS.text }}>
                {busy ? <Spinner size="sm" className="text-white" /> : null}
                Pagar {formatPrice(checkout.amount || amount)}
              </button>
              <p className="text-center text-[11px]" style={{ color: BUYER_COLORS.muted }}>
                El código de seguridad no se guarda.
              </p>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: BUYER_COLORS.muted }}>
                <span className="h-px flex-1" style={{ background: BUYER_COLORS.border }} />o<span className="h-px flex-1" style={{ background: BUYER_COLORS.border }} />
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
              Todavía no tenés tarjetas guardadas. Pagá con una nueva y la próxima vez va a estar acá.
            </p>
          )}

            <button
              type="button"
              onClick={() => void openEmbedded()}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold transition-opacity active:opacity-80"
              style={
                checkout.cards.length > 0
                  ? { border: `1.5px solid ${BUYER_COLORS.border}`, background: '#fff', color: BUYER_COLORS.text }
                  : { background: BUYER_COLORS.text, color: '#fff' }
              }
            >
              {checkout.cards.length > 0 ? 'Usar otra tarjeta' : `Pagar ${formatPrice(checkout.amount || amount)} con una tarjeta nueva`}
            </button>
          </>
          )}

          <style>{`
            #mbbx-container.mbbx-inline,
            #mbbx-container.mbbx-inline[class*="-main"] {
              position: relative !important;
              inset: auto !important;
              top: 0 !important;
              right: auto !important;
              bottom: auto !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              z-index: 1 !important;
              background: transparent !important;
              overflow: visible !important;
              border-radius: 18px !important;
            }
            #mbbx-container.mbbx-inline > div,
            #mbbx-container.mbbx-inline [class*="-container"] {
              position: relative !important;
              inset: auto !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              transform: none !important;
              background: transparent !important;
            }
            #mbbx-container.mbbx-inline [class*="-content"] {
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              right: auto !important;
              transform: none !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: 732px !important;
              min-height: 732px !important;
              max-height: 732px !important;
              overflow: hidden !important;
              background: #fff !important;
            }
            #mbbx-container.mbbx-inline [class*="-close"],
            #mbbx-container.mbbx-inline [class*="-prerender"] {
              display: none !important;
              height: 0 !important;
              width: 0 !important;
              min-height: 0 !important;
              overflow: hidden !important;
              visibility: hidden !important;
            }
            #mbbx-container.mbbx-inline iframe[name^="__zoid__"] {
              position: absolute !important;
              top: -${EMBED_CROP_TOP}px !important;
              right: 0 !important;
              bottom: 0 !important;
              left: 0 !important;
              display: block !important;
              width: 100% !important;
              height: calc(100% + ${EMBED_CROP_TOP}px) !important;
              margin: 0 !important;
              border: 0 !important;
            }
          `}</style>
          {embedOpen && (
            <button
              type="button"
              onClick={backToCards}
              className="self-start text-[13px] font-semibold underline"
              style={{ color: BUYER_COLORS.text }}
            >
              {checkout.cards.length > 0 ? 'Volver a mis tarjetas' : 'Volver'}
            </button>
          )}
          {embedOpen && embedLoading && (
            <div className="flex items-center justify-center gap-2.5 py-10 text-[13px]" style={{ color: BUYER_COLORS.muted }}>
              <Spinner size="sm" /> Cargando…
            </div>
          )}
          <div ref={embedSlot} className={embedOpen ? 'relative mt-2' : 'relative'}>
            <div id="mbbx-container" className={embedOpen ? 'mbbx-inline overflow-hidden rounded-[18px]' : 'hidden'} />
            {embedOpen && <span aria-hidden className="absolute right-2 top-2 z-[2] h-9 w-9" style={{ background: '#fff' }} />}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13px] font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {notice && step !== 'confirming' && (
        <p className="text-center text-[12px]" style={{ color: BUYER_COLORS.muted }}>
          {notice}
        </p>
      )}
    </div>
  )
}
