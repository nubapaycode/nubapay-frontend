'use client'

import { CheckCircle2, ExternalLink, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition font-mono'

const MP_CREDENTIALS_URL = 'https://www.mercadopago.com.ar/developers/panel/app/credentials/production'

export function ConfigView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tokenDraft, setTokenDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const { show: showToast, ToastPortal } = useToast()

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) {
      setEvent(res.event)
    } else {
      showToast(res.error, 'error')
    }
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const handleSave = async () => {
    const token = tokenDraft.trim()
    if (!token) return
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: token })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setTokenDraft('')
    showToast('Token guardado correctamente.', 'success')
  }

  const handleRemove = async () => {
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: null })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    showToast('Token eliminado.', 'success')
  }

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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <ToastPortal />

      <OrganizerToolHeading
        title="Configuración"
        description="Ajustes del evento y métodos de pago."
      />

      {/* Sección Mercado Pago */}
      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#009EE3]/10 flex items-center justify-center shrink-0">
            {/* Logo MP simplificado */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 8c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z" fill="#009EE3" fillOpacity=".15" stroke="#009EE3" strokeWidth="1.2" />
              <path d="M5 8.5l2 2 4-4" stroke="#009EE3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Mercado Pago</p>
            <p className="text-xs text-gray-400 mt-0.5">Los pagos de este evento van a tu propia cuenta de MP</p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Estado actual */}
          {event.has_mp_token ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                  <p className="text-xs text-green-600 mt-0.5">Los pagos van a tu cuenta de Mercado Pago</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0 transition-colors"
              >
                <Trash2 size={13} aria-hidden />
                Desconectar
              </button>
            </div>
          ) : null}

          {/* Instrucciones */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {event.has_mp_token ? 'Reemplazar token' : 'Cómo conectar tu cuenta de Mercado Pago'}
            </p>

            {!event.has_mp_token && (
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">1</span>
                  <span>
                    Entrá a{' '}
                    <a
                      href="https://www.mercadopago.com.ar/developers/panel/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                      mercadopago.com/developers
                      <ExternalLink size={11} aria-hidden />
                    </a>
                    {' '}con tu cuenta de Mercado Pago. Si no tenés cuenta, creá una gratis.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">2</span>
                  <span>
                    Hacé clic en <strong className="text-gray-800">Crear aplicación</strong>. Poné cualquier nombre (por ejemplo, el nombre de tu evento), seleccioná <strong className="text-gray-800">Pagos online</strong> y guardá.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">3</span>
                  <span>
                    Una vez creada la app, entrá a ella y andá a la sección <strong className="text-gray-800">Credenciales de producción</strong> en el menú de la izquierda.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">4</span>
                  <span>
                    Si las credenciales están desactivadas, hacé clic en <strong className="text-gray-800">Activar credenciales de producción</strong> y seguí los pasos que pide MP (puede pedirte datos de tu negocio).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">5</span>
                  <span>
                    Copiá el <strong className="text-gray-800">Access Token</strong> de producción — empieza siempre con <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">APP_USR-</code>. No uses el de prueba (<code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">TEST-</code>) porque los pagos no se acreditarían.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500 mt-0.5">6</span>
                  <span>Pegalo en el campo de abajo y tocá <strong className="text-gray-800">Conectar cuenta</strong>.</span>
                </li>
              </ol>
            )}
          </div>

          {/* Input */}
          <div className="space-y-3">
            <input
              className={inputClass}
              type="password"
              value={tokenDraft}
              onChange={e => setTokenDraft(e.target.value)}
              placeholder="APP_USR-..."
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !tokenDraft.trim()}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              {saving ? 'Guardando…' : event.has_mp_token ? 'Reemplazar token' : 'Conectar cuenta'}
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            El token se guarda de forma segura y nunca se muestra nuevamente. Si necesitás cambiarlo, pegá el nuevo token y guardá.
          </p>

        </div>
      </section>
    </div>
  )
}
