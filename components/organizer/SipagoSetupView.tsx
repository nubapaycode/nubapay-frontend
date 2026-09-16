'use client'

import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Eye, EyeOff, KeyRound, ShieldCheck, Store, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ConnectionApprovedOverlay } from '@/components/organizer/ConnectionApprovedOverlay'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition font-mono'

// ── Pasos ──────────────────────────────────────────────────────────────────

type Step = { title: string; body: React.ReactNode; icon: React.ReactNode }

const SIPAGO_STEPS: Step[] = [
  {
    icon: <Store size={16} aria-hidden />,
    title: 'Tené una cuenta activa en Sipago',
    body: (
      <p className="text-sm text-gray-600 leading-relaxed">
        Necesitás un comercio dado de alta en Sipago. Si todavía no tenés uno, creá tu cuenta antes de seguir con los próximos pasos.
      </p>
    ),
  },
  {
    icon: <ShieldCheck size={16} aria-hidden />,
    title: 'Pedile a Sipago que habilite la integración',
    body: (
      <p className="text-sm text-gray-600 leading-relaxed">
        La{' '}
        <a
          href="https://docs.sipago.coop/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
        >
          documentación de Sipago
          <ExternalLink size={11} aria-hidden />
        </a>
        {' '}indica que primero hay que comunicarse con ellos para solicitar autorización para usar la API Checkout.
      </p>
    ),
  },
  {
    icon: <KeyRound size={16} aria-hidden />,
    title: 'Generá el Client ID y el Client Secret',
    body: (
      <p className="text-sm text-gray-600 leading-relaxed">
        Una vez autorizado, entrá al <strong className="text-gray-800">Portal Sipago</strong>, andá a{' '}
        <strong className="text-gray-800">Tiendas</strong> y generá ahí tus credenciales.
      </p>
    ),
  },
]

// ── Stepper ────────────────────────────────────────────────────────────────

function SipagoStepper({
  clientIdDraft, clientSecretDraft, showSecret, error, saving,
  onClientIdChange, onClientSecretChange, onToggleShowSecret, onSave,
}: {
  clientIdDraft: string; clientSecretDraft: string; showSecret: boolean; error: string; saving: boolean
  onClientIdChange: (v: string) => void; onClientSecretChange: (v: string) => void; onToggleShowSecret: () => void
  onSave: () => void
}) {
  const total = SIPAGO_STEPS.length + 1
  const [current, setCurrent] = useState(0)
  const isLast = current === total - 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= current ? '#111827' : '#e5e7eb' }}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-4 min-h-[132px] flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400">Paso {current + 1} de {total}</p>

          {isLast ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Pegá tus credenciales acá</p>
              <p className="text-xs text-gray-400">Sipago las muestra una sola vez al generarlas: copialas antes de salir del portal.</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4E358B]/10 text-[#4E358B] flex items-center justify-center shrink-0">
                {SIPAGO_STEPS[current].icon}
              </div>
              <div className="space-y-1.5 pt-0.5">
                <p className="text-sm font-semibold text-gray-900">{SIPAGO_STEPS[current].title}</p>
                {SIPAGO_STEPS[current].body}
              </div>
            </div>
          )}

          {isLast && (
            <CredentialsForm
              clientId={clientIdDraft} clientSecret={clientSecretDraft} showSecret={showSecret} error={error}
              onClientIdChange={onClientIdChange} onClientSecretChange={onClientSecretChange} onToggleShowSecret={onToggleShowSecret}
            />
          )}
        </div>

        <div className="px-5 pb-5 flex items-center gap-2">
          {current > 0 && (
            <button type="button" onClick={() => setCurrent(v => v - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={13} aria-hidden />Anterior
            </button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <button type="button" onClick={onSave} disabled={saving || !clientIdDraft.trim() || !clientSecretDraft.trim()}
              className="rounded-full bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors">
              {saving ? 'Guardando…' : 'Conectar cuenta'}
            </button>
          ) : (
            <button type="button" onClick={() => setCurrent(v => v + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-gray-800 transition-colors">
              Siguiente<ChevronRight size={13} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CredentialsForm({
  clientId, clientSecret, showSecret, error,
  onClientIdChange, onClientSecretChange, onToggleShowSecret,
}: {
  clientId: string; clientSecret: string; showSecret: boolean; error: string
  onClientIdChange: (v: string) => void; onClientSecretChange: (v: string) => void; onToggleShowSecret: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-500">Client ID</label>
        <input
          className={inputClass}
          type="text"
          name="sipago-client-id"
          value={clientId}
          onChange={e => onClientIdChange(e.target.value)}
          placeholder="3c21db0f-6913-43db-88d6-2ced87b99a91"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-bwignore="true"
          data-form-type="other"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-500">Client Secret</label>
        <div className="relative">
          <input
            className={`${inputClass} ${error ? 'border-red-300 focus:ring-red-400' : ''}`}
            style={{ paddingRight: '42px' }}
            type={showSecret ? 'text' : 'password'}
            name="sipago-client-secret"
            value={clientSecret}
            onChange={e => onClientSecretChange(e.target.value)}
            placeholder="ft6z30q2ftsmu90au0mp"
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore
            data-bwignore="true"
            data-form-type="other"
          />
          <button type="button" onClick={onToggleShowSecret} tabIndex={-1}
            aria-label={showSecret ? 'Ocultar client secret' : 'Mostrar client secret'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {showSecret ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

export function SipagoSetupView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { show: showToast, ToastPortal } = useToast()

  const [clientIdDraft, setClientIdDraft] = useState('')
  const [clientSecretDraft, setClientSecretDraft] = useState('')
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  /** Pantalla verde de aprobado; al terminar vuelve a Métodos de pago. */
  const [approved, setApproved] = useState(false)
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) setEvent(res.event)
    else showToast(res.error, 'error')
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const handleSave = async () => {
    const clientId = clientIdDraft.trim()
    const clientSecret = clientSecretDraft.trim()
    if (!clientId || !clientSecret) {
      setError('Completá el Client ID y el Client Secret.')
      return
    }
    setError('')
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, {
      sipago_client_id: clientId,
      sipago_client_secret: clientSecret,
    })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setClientIdDraft('')
    setClientSecretDraft('')
    setReplaceOpen(false)
    window.dispatchEvent(new CustomEvent('nubapay-sipago-connected'))
    setApproved(true)
  }

  const handleRemove = async () => {
    setConfirmDisconnect(false)
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, {
      sipago_client_id: null,
      sipago_client_secret: null,
    })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setReplaceOpen(false)
    window.dispatchEvent(new CustomEvent('nubapay-sipago-disconnected'))
    showToast('Cuenta desconectada.', 'success')
  }

  const backHref = `/events/${eventId}/metodos-pago`

  if (loading) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ToastPortal />
        <p className="text-sm text-gray-400">No se pudo cargar el evento.</p>
      </div>
    )
  }

  if (approved) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ConnectionApprovedOverlay
          title="¡Cuenta conectada!"
          subtitle="Sipago quedó listo para cobrar. Volviendo a Métodos de pago…"
          onDone={() => router.replace(backHref)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <ToastPortal />

      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={15} aria-hidden />
        Volver a Métodos de pago
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#4E358B]/10 flex items-center justify-center shrink-0 overflow-hidden">
          <Image src="/images/sipagologo.png" alt="Sipago" width={36} height={36} className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Conectá tu Sipago</h1>
          <p className="text-xs text-gray-400 mt-0.5">Los cobros van directo a tu cuenta de Sipago</p>
        </div>
      </div>

      {event.has_sipago_credentials ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-green-50 border border-green-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                <p className="text-xs text-green-600 mt-0.5">Los pagos van a tu cuenta de Sipago</p>
              </div>
            </div>
            <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0 transition-colors">
              <Trash2 size={13} aria-hidden />Desconectar
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <button type="button" onClick={() => setReplaceOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span>Reemplazar credenciales</span>
              <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${replaceOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {replaceOpen && (
              <div className="px-5 pb-5 pt-4 space-y-3 border-t border-gray-100">
                <CredentialsForm
                  clientId={clientIdDraft} clientSecret={clientSecretDraft} showSecret={showSecret} error={error}
                  onClientIdChange={v => { setClientIdDraft(v); setError('') }}
                  onClientSecretChange={v => { setClientSecretDraft(v); setError('') }}
                  onToggleShowSecret={() => setShowSecret(v => !v)}
                />
                <button type="button" onClick={() => void handleSave()} disabled={saving || !clientIdDraft.trim() || !clientSecretDraft.trim()}
                  className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                  {saving ? 'Guardando…' : 'Reemplazar credenciales'}
                </button>
                <p className="text-xs text-gray-400 leading-relaxed">Las credenciales se guardan de forma segura y nunca se muestran nuevamente.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <SipagoStepper
          clientIdDraft={clientIdDraft} clientSecretDraft={clientSecretDraft} showSecret={showSecret} error={error} saving={saving}
          onClientIdChange={v => { setClientIdDraft(v); setError('') }}
          onClientSecretChange={v => { setClientSecretDraft(v); setError('') }}
          onToggleShowSecret={() => setShowSecret(v => !v)}
          onSave={() => void handleSave()}
        />
      )}

      <Modal isOpen={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} title="¿Desconectar Sipago?">
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Si desconectás la cuenta, los pagos con Sipago del evento dejarán de procesarse hasta que conectes nuevas credenciales. Esta acción no afecta los pedidos ya cobrados.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => setConfirmDisconnect(false)}
            className="flex-1 rounded-full border border-gray-200 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => void handleRemove()}
            className="flex-1 rounded-full bg-red-500 text-white text-sm font-semibold py-3 hover:bg-red-600 transition-colors">
            Desconectar
          </button>
        </div>
      </Modal>
    </div>
  )
}
