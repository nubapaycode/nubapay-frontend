'use client'

import { useCallback, useState } from 'react'

import { authHeadersJson, getAuthUser, setAuthSession, getAuthToken } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { authPaths } from '@/lib/api/paths'

type Step = {
  icon: React.ReactNode
  title: string
  description: React.ReactNode
}

const steps: Step[] = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#F5F5F7" />
        <path d="M20 10l8 4.5v9L20 28l-8-4.5v-9L20 10z" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 14.5l8 4.5 8-4.5M20 19v9" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Bienvenido a nubapay',
    description: (
      <p>
        Tu plataforma de <strong>menú digital y pedidos en vivo</strong> para eventos. En dos minutos vas a tener tu catálogo online y listo para recibir pagos.
      </p>
    ),
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#F5F5F7" />
        <rect x="10" y="12" width="20" height="16" rx="2.5" stroke="#111" strokeWidth="1.6" />
        <path d="M20 16v8M16 20h8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Creá tu primer evento',
    description: (
      <ol className="space-y-2 text-left">
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">1.</span> Tocá <strong>Nuevo evento</strong> en la pantalla de inicio.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">2.</span> Poné el nombre del evento y guardá.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">3.</span> Desde <strong>Link del catálogo</strong>, subí una foto de portada y elegí el texto del link para compartirlo.</li>
      </ol>
    ),
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#F5F5F7" />
        <rect x="10" y="10" width="8" height="8" rx="1.5" stroke="#111" strokeWidth="1.6" />
        <rect x="22" y="10" width="8" height="8" rx="1.5" stroke="#111" strokeWidth="1.6" />
        <rect x="10" y="22" width="8" height="8" rx="1.5" stroke="#111" strokeWidth="1.6" />
        <path d="M22 22h2v2h-2zM26 22h4M22 26h4M26 26h4" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Armá tu catálogo',
    description: (
      <ol className="space-y-2 text-left">
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">1.</span> Entrá al evento y andá a <strong>Catálogo</strong>.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">2.</span> Agregá productos con nombre, precio y foto.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">3.</span> También podés crear <strong>combos</strong> que agrupan varios productos.</li>
      </ol>
    ),
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#F5F5F7" />
        <path d="M14 20c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 14v-3M20 29v-3M26 20h3M11 20h3" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2.5" fill="#111" />
      </svg>
    ),
    title: 'Compartí el link con tus clientes',
    description: (
      <ol className="space-y-2 text-left">
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">1.</span> Copiá el link del catálogo desde <strong>Link del catálogo</strong>.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">2.</span> Compartilo por WhatsApp, Instagram o proyectalo en pantalla.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">3.</span> Tus clientes eligen productos y pagan con <strong>Mercado Pago o efectivo</strong>, sin instalar nada.</li>
      </ol>
    ),
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#F5F5F7" />
        <path d="M12 14h6v6h-6zM12 22h6v6h-6zM20 14h8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20h8M20 26h4" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Gestioná pedidos en tiempo real',
    description: (
      <ol className="space-y-2 text-left">
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">1.</span> Los pedidos aparecen en <strong>Pedidos</strong> al instante.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">2.</span> Usá el <strong>Escáner</strong> para leer el QR del cliente y marcar el pedido como listo.</li>
        <li className="flex gap-2"><span className="font-semibold text-gray-900 shrink-0">3.</span> En <strong>Configuración</strong> podés conectar tu propia cuenta de Mercado Pago para recibir los pagos directo.</li>
      </ol>
    ),
  },
]

async function markOnboardingComplete() {
  try {
    const res = await browserFetch(authPaths.completeOnboarding(), {
      method: 'POST',
      headers: authHeadersJson(),
    })
    const body = (await res.json()) as { user?: { onboarding_completed?: boolean } }
    const token = getAuthToken()
    const user = getAuthUser()
    if (token && user && body.user) {
      setAuthSession(token, { ...user, onboarding_completed: true })
    }
  } catch {
    // si falla la red, igual cerramos — el flag se setea al próximo login
  }
}

export function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = useCallback(async () => {
    if (isLast) {
      await markOnboardingComplete()
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }, [isLast, onDone])

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-7 pt-8 pb-6 flex flex-col items-center text-center gap-5 flex-1">
          {current.icon}

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{current.title}</h2>
            <div className="text-sm text-gray-500 leading-relaxed">
              {current.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-8 flex flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={() => void handleNext()}
            className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3.5 hover:bg-gray-800 active:scale-95 transition-all"
          >
            {isLast ? 'Empezar' : 'Siguiente'}
          </button>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? '#111827' : '#E5E7EB',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
