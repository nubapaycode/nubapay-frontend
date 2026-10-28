'use client'

import { CheckCircle2, ChevronDown, ChevronLeft, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
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

function CredentialsForm({
  apiKey, accessToken, showToken, error,
  onApiKeyChange, onAccessTokenChange, onToggleShowToken,
}: {
  apiKey: string
  accessToken: string
  showToken: boolean
  error: string
  onApiKeyChange: (v: string) => void
  onAccessTokenChange: (v: string) => void
  onToggleShowToken: () => void
}) {
  return (
    <div className="space-y-3">
      <input
        name="mobbex-api-key"
        value={apiKey}
        onChange={e => onApiKeyChange(e.target.value)}
        autoComplete="off"
        placeholder="API Key"
        aria-label="API Key"
        className={inputClass}
      />
      <div className="relative">
        <input
          name="mobbex-access-token"
          type={showToken ? 'text' : 'password'}
          value={accessToken}
          onChange={e => onAccessTokenChange(e.target.value)}
          autoComplete="off"
          placeholder="Access Token"
          aria-label="Access Token"
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onToggleShowToken}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
        >
          {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function MobbexSetupView({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [approved, setApproved] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const { show: showToast, ToastPortal } = useToast()

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) setEvent(res.event)
    else showToast(res.error, 'error')
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const backHref = `/events/${eventId}/metodos-pago`

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    const res = await patchOrganizerEvent(eventId, {
      mobbex_api_key: apiKey.trim(),
      mobbex_access_token: accessToken.trim(),
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEvent(res.event)
    setApiKey('')
    setAccessToken('')
    window.dispatchEvent(new CustomEvent('nubapay-mobbex-connected'))
    if (!event?.has_mobbex_credentials) setApproved(true)
    else {
      setReplaceOpen(false)
      showToast('Credenciales actualizadas', 'success')
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, {
      mobbex_api_key: null,
      mobbex_access_token: null,
    })
    setSaving(false)
    setConfirmDisconnect(false)
    if (!res.ok) {
      showToast(res.error, 'error')
      return
    }
    setEvent(res.event)
    window.dispatchEvent(new CustomEvent('nubapay-mobbex-disconnected'))
    showToast('Mobbex desconectado', 'success')
  }

  if (loading || !event) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  if (approved) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ConnectionApprovedOverlay
          title="¡Cuenta conectada!"
          subtitle="Mobbex quedó listo para cobrar. Volviendo a Métodos de pago…"
          onDone={() => router.replace(backHref)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <ToastPortal />
      <Modal
        isOpen={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Desconectar Mobbex"
      >
        <p className="text-sm text-gray-600">
          Los compradores dejan de ver Mobbex en este evento. Las órdenes ya cobradas no se modifican.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirmDisconnect(false)} className="rounded-full px-4 py-2 text-sm text-gray-600">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={saving}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Desconectar
          </button>
        </div>
      </Modal>

      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ChevronLeft size={15} aria-hidden />
        Volver a Métodos de pago
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
          <Image src="/images/mobbex.png" alt="Mobbex" width={36} height={36} className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Conectá tu Mobbex</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tarjeta, QR o efectivo, en la página de pago de Mobbex</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        Desde la consola de Mobbex, en Desarrolladores, copiá la API Key y el Access Token. La guía está en{' '}
        <a
          href="https://www.mobbex.com/desarrolladores/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
        >
          Mobbex para desarrolladores
          <ExternalLink size={11} aria-hidden />
        </a>
        . Podés guardarlas ahora y reemplazarlas cuando te las den.
      </p>

      {event.has_mobbex_credentials ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-green-50 border border-green-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                <p className="text-xs text-green-600 mt-0.5">Los pagos van a tu cuenta de Mobbex</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDisconnect(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0 transition-colors"
            >
              <Trash2 size={13} aria-hidden />Desconectar
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setReplaceOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Reemplazar credenciales</span>
              <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${replaceOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {replaceOpen && (
              <div className="px-5 pb-5 pt-4 space-y-3 border-t border-gray-100">
                <CredentialsForm
                  apiKey={apiKey}
                  accessToken={accessToken}
                  showToken={showToken}
                  error={error}
                  onApiKeyChange={v => { setApiKey(v); setError('') }}
                  onAccessTokenChange={v => { setAccessToken(v); setError('') }}
                  onToggleShowToken={() => setShowToken(v => !v)}
                />
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !apiKey.trim() || !accessToken.trim()}
                  className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {saving ? 'Guardando…' : 'Reemplazar credenciales'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4 shadow-sm">
          <CredentialsForm
            apiKey={apiKey}
            accessToken={accessToken}
            showToken={showToken}
            error={error}
            onApiKeyChange={v => { setApiKey(v); setError('') }}
            onAccessTokenChange={v => { setAccessToken(v); setError('') }}
            onToggleShowToken={() => setShowToken(v => !v)}
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !apiKey.trim() || !accessToken.trim()}
            className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {saving ? 'Guardando…' : 'Conectar Mobbex'}
          </button>
          <p className="text-xs text-gray-400 leading-relaxed">Las credenciales se guardan cifradas y no se vuelven a mostrar.</p>
        </div>
      )}
    </div>
  )
}
