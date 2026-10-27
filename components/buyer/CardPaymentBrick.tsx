'use client'

import { useEffect, useRef, useState } from 'react'
import { catalogPaths } from '@/lib/api/paths'
import { BUYER_COLORS } from '@/lib/buyerUi'

type BrickController = { unmount: () => void }

type MercadoPagoSdk = new (
  publicKey: string,
  options: { locale: string },
) => {
  bricks: () => {
    create: (type: string, containerId: string, settings: object) => Promise<BrickController>
  }
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoSdk
  }
}

type CardFormData = {
  token?: string
  issuer_id?: string
  payment_method_id?: string
  installments?: number
  payer?: {
    email?: string
    identification?: { type?: string; number?: string }
  }
}

/** Error que entrega el Brick: `non_critical` son avisos (campos inválidos, etc.) que el propio Brick ya muestra. */
type BrickError = { type?: 'critical' | 'non_critical'; cause?: string; message?: string }

type ThreeDsChallenge ={ external_resource_url: string; creq: string }

/**
 * Desafío 3DS del banco (típico de Visa). Mercado Pago pide abrirlo con un POST
 * a `external_resource_url` llevando el `creq`, dentro de un iframe; un GET
 * directo a la URL muestra "no pudimos obtener la información del pago".
 * Al terminar el desafío la página del iframe avisa con un postMessage.
 */
function ThreeDsFrame({ challenge, onComplete }: { challenge: ThreeDsChallenge; onComplete: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    formRef.current?.submit()
  }, [challenge])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return
      if ((e.data as { status?: string } | null)?.status === 'COMPLETE') onCompleteRef.current()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const frameName = 'mp-3ds-challenge'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium" style={{ color: BUYER_COLORS.text }}>
        Tu banco necesita confirmar el pago. Completá la verificación para terminar.
      </p>
      <form ref={formRef} action={challenge.external_resource_url} method="POST" target={frameName} className="hidden">
        <input type="hidden" name="creq" value={challenge.creq} />
      </form>
      <iframe
        ref={frameRef}
        name={frameName}
        title="Verificación de tu banco"
        className="w-full rounded-xl border-0"
        style={{ height: 520 }}
      />
    </div>
  )
}

let sdkPromise: Promise<void> | null = null

function loadMpSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        sdkPromise = null
        reject(new Error('sdk'))
      }
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  try {
    return JSON.stringify(err) ?? String(err)
  } catch {
    return String(err)
  }
}

export function CardPaymentBrick({
  orderId,
  publicKey,
  amount,
  email,
  onPaid,
  onReview,
}: {
  orderId: string
  publicKey: string
  amount: number
  email?: string | null
  onPaid: () => void
  onReview: () => void
}) {
  const [error, setError] = useState('')
  /** Detalle técnico del último error, visible en pantalla para poder mandar una captura a soporte. */
  const [errorDetail, setErrorDetail] = useState('')
  const [ready, setReady] = useState(false)
  const [challenge, setChallenge] = useState<ThreeDsChallenge | null>(null)
  const onPaidRef = useRef(onPaid)
  const onReviewRef = useRef(onReview)
  onPaidRef.current = onPaid
  onReviewRef.current = onReview
  const containerId = `mp-card-brick-${orderId}`

  useEffect(() => {
    let cancelled = false
    let controller: BrickController | null = null
    setError('')
    setErrorDetail('')
    setReady(false)

    const mount = async () => {
      try {
        await loadMpSdk()
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo cargar el formulario de tarjeta. Recargá la página.')
          setErrorDetail(`loadMpSdk: ${describeError(err)}`)
        }
        return
      }
      if (cancelled || !window.MercadoPago) return
      const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' })
      const brick = await mp.bricks().create('cardPayment', containerId, {
        initialization: {
          amount,
          payer: email ? { email } : undefined,
        },
        customization: {
          visual: { style: { theme: 'default' } },
          // Solo se cobra en un pago (sin cuotas).
          paymentMethods: { minInstallments: 1, maxInstallments: 1 },
        },
        callbacks: {
          onReady: () => {
            if (!cancelled) setReady(true)
          },
          onError: (brickError?: BrickError) => {
            // El detalle (cause/message) es lo único que dice por qué falló: sin esto no se puede diagnosticar.
            console.error('[MercadoPago Brick]', brickError)
            if (cancelled) return
            setErrorDetail(`Brick onError: ${describeError(brickError)}`)
            if (brickError?.type === 'non_critical') return
            setError('No se pudo mostrar el formulario de tarjeta.')
          },
          onSubmit: (cardFormData: CardFormData & { formData?: CardFormData }) => {
            const formData = cardFormData.formData ?? cardFormData
            return fetch(catalogPaths.chargeOrderCard(orderId), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Branded-Host': window.location.host,
              },
              body: JSON.stringify({
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                installments: 1,
                issuer_id: formData.issuer_id,
                payer_email: formData.payer?.email,
                identification_type: formData.payer?.identification?.type,
                identification_number: formData.payer?.identification?.number,
              }),
            })
              .then(async (res) => {
                const data = await res.json().catch(() => ({}))
                if (!res.ok) {
                  setErrorDetail(`Cobro HTTP ${res.status}: ${data.error ?? '(sin mensaje)'}`)
                  throw new Error(data.error || 'No se pudo cobrar la tarjeta')
                }
                if (data.three_ds?.external_resource_url && data.three_ds?.creq) {
                  setChallenge(data.three_ds)
                  return
                }
                if (data.status === 'approved') {
                  onPaidRef.current()
                  return
                }
                if (data.status === 'in_process') {
                  onReviewRef.current()
                  return
                }
                if (data.status === 'rejected') {
                  setErrorDetail(
                    `Cobro rechazado: ${data.error ?? '(sin mensaje)'}${data.status_detail ? ` [${data.status_detail}]` : ''}`,
                  )
                  throw new Error(data.error || 'El pago fue rechazado')
                }
                onReviewRef.current()
              })
              .catch((err: unknown) => {
                setErrorDetail(prev => prev || `Cobro: ${describeError(err)}`)
                throw err
              })
          },
        },
      }).catch((err: unknown) => {
        if (!cancelled) {
          setError('No se pudo mostrar el formulario de tarjeta.')
          setErrorDetail(`bricks.create: ${describeError(err)}`)
        }
        return null
      })
      if (!brick) return
      if (cancelled) {
        brick.unmount()
        return
      }
      controller = brick
    }

    void mount()
    return () => {
      cancelled = true
      controller?.unmount()
    }
  }, [amount, containerId, email, orderId, publicKey])

  return (
    <div className="flex flex-col gap-2">
      {!ready && !error && (
        <p className="text-center text-[12px]" style={{ color: BUYER_COLORS.muted }}>
          Cargando el formulario de tarjeta…
        </p>
      )}
      {challenge && (
        <ThreeDsFrame
          challenge={challenge}
          onComplete={() => {
            setChallenge(null)
            onReviewRef.current()
          }}
        />
      )}
      <div id={containerId} className={challenge ? 'hidden' : undefined} />
      {error && (
        <p className="text-[13px] font-medium" style={{ color: '#DC2626' }}>{error}</p>
      )}
      {errorDetail && (
        <div className="rounded-lg p-2.5" style={{ background: BUYER_COLORS.subtleFill }}>
          <p className="text-[11px] font-semibold" style={{ color: BUYER_COLORS.text }}>
            Detalle técnico (mandá una captura a soporte):
          </p>
          <pre
            className="mt-1 whitespace-pre-wrap break-all text-[11px] leading-snug"
            style={{ color: BUYER_COLORS.muted }}
          >
            {errorDetail}
          </pre>
        </div>
      )}
      <p className="text-[11px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
        El formulario es de Mercado Pago. El número de tarjeta no pasa por Nubapay. Puede pedirte el documento del titular porque el cobro con tarjeta lo exige.
      </p>
    </div>
  )
}
