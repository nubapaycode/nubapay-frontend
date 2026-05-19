'use client'

import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

const monoInputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition font-mono'

// ── Pasos ──────────────────────────────────────────────────────────────────

type Step = { title: string; body: React.ReactNode }

const MP_STEPS: Step[] = [
  {
    title: 'Accedé al panel de developers',
    body: (
      <p className="text-sm text-gray-600 leading-relaxed">
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
        {' '}con tu cuenta de Mercado Pago. Si todavía no tenés una, podés crearla gratis desde el mismo sitio.
      </p>
    ),
  },
  {
    title: 'Creá una aplicación',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Hacé clic en <strong className="text-gray-800">Crear aplicación</strong>. Poné cualquier nombre, seleccioná{' '}
          <strong className="text-gray-800">Pagos online</strong> como modelo de integración y guardá.
        </p>
        <style>{`
          @keyframes mp-spring {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.13); }
            70%  { transform: scale(0.97); }
            85%  { transform: scale(1.04); }
            93%  { transform: scale(0.99); }
            100% { transform: scale(1); }
          }
          .mp-spring-btn { animation: mp-spring 2.2s ease-in-out infinite; animation-delay: 0.8s; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none" style={{ fontSize: 0 }}>
          <div className="flex items-center justify-between px-3 py-1.5 gap-2" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><ellipse cx="5" cy="6" rx="5" ry="6" fill="#009EE3"/><ellipse cx="13" cy="6" rx="5" ry="6" fill="#009EE3" fillOpacity=".6"/></svg>
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <div className="rounded px-2 py-0.5" style={{ background: '#3483FA', fontSize: '7px', fontWeight: 700, color: '#fff', lineHeight: '14px' }}>Crear aplicación</div>
          </div>
          <div className="px-4 py-3" style={{ background: '#EBEBEB' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>Integraciones</p>
            <p style={{ fontSize: '7px', color: '#666', marginBottom: '8px' }}>Gestioná tus aplicaciones y credenciales de acceso.</p>
            <div className="flex gap-3 mb-2" style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
              <span style={{ fontSize: '7px', color: '#3483FA', fontWeight: 600, borderBottom: '1.5px solid #3483FA', paddingBottom: '3px' }}>Tus aplicaciones</span>
              <span style={{ fontSize: '7px', color: '#666' }}>Aplicaciones de otras cuentas</span>
            </div>
            <div className="rounded-lg flex flex-col items-center py-3 gap-1.5" style={{ background: '#fff' }}>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none"><ellipse cx="12" cy="16" rx="8" ry="4" fill="#eee"/><circle cx="16" cy="8" r="6" fill="#e8e8e8" stroke="#ccc" strokeWidth="1"/><path d="M13 8c0-1.5 1-2.5 2.5-2.5" stroke="#aaa" strokeWidth="1" strokeLinecap="round"/><path d="M10 14c1-2 3-3 5-3" stroke="#bbb" strokeWidth="0.8" strokeLinecap="round"/></svg>
              <p style={{ fontSize: '8px', fontWeight: 600, color: '#1a1a1a' }}>Creá tu primera aplicación</p>
              <p style={{ fontSize: '6.5px', color: '#888', marginBottom: '2px' }}>Empezá a integrar con Mercado Pago.</p>
              <div className="mp-spring-btn rounded px-3 py-1" style={{ background: '#3483FA', fontSize: '7.5px', fontWeight: 700, color: '#fff' }}>Crear aplicación</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Activá las credenciales de producción',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Dentro de la app, andá a <strong className="text-gray-800">Credenciales de producción</strong> en el menú lateral. Si aparecen desactivadas, activalas siguiendo los pasos que indica MP.
        </p>
        <style>{`
          @keyframes mp-sidebar-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .mp-sidebar-highlight { animation: mp-sidebar-pulse 2s ease-in-out infinite; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><ellipse cx="5" cy="6" rx="5" ry="6" fill="#009EE3"/><ellipse cx="13" cy="6" rx="5" ry="6" fill="#009EE3" fillOpacity=".6"/></svg>
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <span style={{ fontSize: '6px', color: '#444' }}>Tu cuenta ▾</span>
          </div>
          <div className="flex" style={{ background: '#F5F5F5', minHeight: '110px' }}>
            <div className="shrink-0 py-2 px-2.5 space-y-2.5" style={{ width: '110px', background: '#fff', borderRight: '1px solid #eee' }}>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRUEBAS</p>
                {['Credenciales de prueba', 'Cuentas de prueba', 'Tarjetas de prueba'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>NOTIFICACIONES</p>
                {['Webhooks', 'IPN'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRODUCCIÓN</p>
                <div className="mp-sidebar-highlight flex items-center gap-1 rounded" style={{ background: '#EBF3FF', padding: '2.5px 4px' }}>
                  <p style={{ fontSize: '6.5px', color: '#3483FA', fontWeight: 700 }}>Credenciales de producción</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>EVALUACIÓN</p>
                {['Información de integración', 'Calidad de integración'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
            </div>
            <div className="flex-1 p-3 space-y-1.5">
              <p style={{ fontSize: '7px', color: '#aaa' }}>4 tareas pendientes</p>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: '8.5px', fontWeight: 700, color: '#1a1a1a' }}>Realizar integración</p>
                <div className="rounded px-2 py-0.5" style={{ background: '#3483FA', fontSize: '6px', fontWeight: 700, color: '#fff' }}>Comenzar ›</div>
              </div>
              {['Probar la integración', 'Salir a producción'].map(item => (
                <div key={item} className="flex items-center justify-between rounded" style={{ background: '#fff', padding: '4px 6px' }}>
                  <p style={{ fontSize: '6.5px', color: '#888' }}>{item}</p>
                  <span style={{ fontSize: '7px', color: '#bbb' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Copiá tu Access Token',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Una vez activadas, vas a ver tu <strong className="text-gray-800">Access Token</strong> de producción. Siempre empieza con{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">APP_USR-</code>.{' '}
          No uses el de prueba (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">TEST-</code>) o los pagos no se acreditarán.
        </p>
        <style>{`
          @keyframes mp-copy-spring {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.13); }
            70%  { transform: scale(0.97); }
            85%  { transform: scale(1.04); }
            93%  { transform: scale(0.99); }
            100% { transform: scale(1); }
          }
          .mp-copy-btn { animation: mp-copy-spring 2.2s ease-in-out infinite; animation-delay: 0.8s; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><ellipse cx="5" cy="6" rx="5" ry="6" fill="#009EE3"/><ellipse cx="13" cy="6" rx="5" ry="6" fill="#009EE3" fillOpacity=".6"/></svg>
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <span style={{ fontSize: '6px', color: '#444' }}>Tu cuenta ▾</span>
          </div>
          <div className="flex" style={{ background: '#F5F5F5' }}>
            <div className="shrink-0 py-2 px-2.5 space-y-2" style={{ width: '90px', background: '#fff', borderRight: '1px solid #eee' }}>
              <div>
                <p style={{ fontSize: '7px', fontWeight: 700, color: '#1a1a1a' }}>testeo4 ›</p>
                <p style={{ fontSize: '5.5px', color: '#999', marginTop: '1px' }}>Integración con CódigoQR</p>
              </div>
              <p style={{ fontSize: '6px', color: '#555' }}>Configuración de la aplicación</p>
              <div style={{ borderTop: '1px solid #eee', paddingTop: '6px' }}>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRUEBAS</p>
                {['Credenciales de prueba', 'Cuentas de prueba'].map(item => (
                  <p key={item} style={{ fontSize: '6px', color: '#555', padding: '1px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRODUCCIÓN</p>
                <p style={{ fontSize: '6px', color: '#3483FA', fontWeight: 600 }}>Credenciales de producción</p>
              </div>
            </div>
            <div className="flex-1 px-3 py-2.5 space-y-1.5">
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#1a1a1a' }}>Credenciales de producción</p>
              <p style={{ fontSize: '5.5px', color: '#666', marginBottom: '6px', lineHeight: 1.4 }}>Las credenciales <strong>sirven para recibir pagos reales</strong>.</p>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#fff', border: '1px solid #eee' }}>
                <p style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>Public Key</p>
                <p style={{ fontSize: '5.5px', color: '#333', fontFamily: 'monospace' }}>APP_USR-635dba9b···</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#EBF3FF', border: '1.5px solid #3483FA' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p style={{ fontSize: '6px', fontWeight: 700, color: '#3483FA' }}>Access Token</p>
                    <svg width="8" height="8" viewBox="0 0 14 10" fill="none"><path d="M1 5C2.5 2 4.5 1 7 1s4.5 1 6 4c-1.5 3-3.5 4-6 4S2.5 8 1 5z" stroke="#3483FA" strokeWidth="1.3"/><circle cx="7" cy="5" r="1.8" stroke="#3483FA" strokeWidth="1.3"/></svg>
                  </div>
                  <div className="mp-copy-btn rounded" style={{ background: '#3483FA', padding: '2px 5px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.2"/><path d="M1 7V2a1 1 0 011-1h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: '5.5px', color: '#fff', fontWeight: 700 }}>Copiar</span>
                  </div>
                </div>
                <p style={{ fontSize: '5.5px', color: '#999', fontFamily: 'monospace', marginTop: '2px', letterSpacing: '0.5px' }}>••••••••••••••••••••••••••••••••</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#fff', border: '1px solid #eee' }}>
                <p style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>Client ID</p>
                <p style={{ fontSize: '5.5px', color: '#333', fontFamily: 'monospace' }}>750377788699931</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

// ── Stepper ────────────────────────────────────────────────────────────────

function MpStepper({
  tokenDraft, tokenError, showToken, saving,
  onTokenChange, onToggleShow, onSave,
}: {
  tokenDraft: string; tokenError: string; showToken: boolean; saving: boolean
  onTokenChange: (v: string) => void; onToggleShow: () => void; onSave: () => void
}) {
  const total = MP_STEPS.length + 1
  const [current, setCurrent] = useState(0)
  const isLast = current === total - 1

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= current ? 'bg-gray-900' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-4 min-h-[140px] flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400">Paso {current + 1} de {total}</p>

          {isLast ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Pegá el token acá</p>
              <p className="text-xs text-gray-400">El token se guarda de forma segura y nunca se muestra nuevamente.</p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900">{MP_STEPS[current].title}</p>
          )}

          {isLast ? (
            <TokenInput value={tokenDraft} onChange={onTokenChange} show={showToken} onToggleShow={onToggleShow} error={tokenError} />
          ) : (
            <div>{MP_STEPS[current].body}</div>
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
            <button type="button" onClick={onSave} disabled={saving || !tokenDraft.trim()}
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

// ── Vista principal ────────────────────────────────────────────────────────

export function MercadoPagoSetupView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { show: showToast, ToastPortal } = useToast()

  const [tokenDraft, setTokenDraft] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) setEvent(res.event)
    else showToast(res.error, 'error')
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const handleSaveToken = async () => {
    const token = tokenDraft.trim()
    if (!token) return
    if (!token.startsWith('APP_USR-')) {
      setTokenError('El token de producción siempre empieza con APP_USR-. Verificá que no estés usando el token de prueba.')
      return
    }
    setTokenError('')
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: token })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setTokenDraft('')
    setReplaceOpen(false)
    showToast('Token guardado correctamente.', 'success')
  }

  const handleRemoveToken = async () => {
    setConfirmDisconnect(false)
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: null })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setReplaceOpen(false)
    showToast('Cuenta desconectada.', 'success')
  }

  const backHref = `/events/${eventId}/cuenta`

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
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <ToastPortal />

      {/* Botón volver */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={15} aria-hidden />
        Volver a Cuenta
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#009EE3]/10 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5S13.14 1.5 9 1.5z" fill="#009EE3" fillOpacity=".12" />
            <path d="M6 9.75l2 2 4-4.5" stroke="#009EE3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Mercado Pago</h1>
          <p className="text-xs text-gray-400 mt-0.5">Los cobros van directo a tu cuenta de MP</p>
        </div>
      </div>

      {event.has_mp_token ? (
        <div className="space-y-4">
          {/* Estado conectado */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-green-50 border border-green-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                <p className="text-xs text-green-600 mt-0.5">Los pagos van a tu cuenta de Mercado Pago</p>
              </div>
            </div>
            <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0 transition-colors">
              <Trash2 size={13} aria-hidden />Desconectar
            </button>
          </div>

          {/* Acordeón reemplazar */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <button type="button" onClick={() => setReplaceOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span>Reemplazar token</span>
              <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${replaceOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {replaceOpen && (
              <div className="px-5 pb-5 pt-4 space-y-3 border-t border-gray-100">
                <TokenInput value={tokenDraft} onChange={v => { setTokenDraft(v); setTokenError('') }}
                  show={showToken} onToggleShow={() => setShowToken(v => !v)} error={tokenError} />
                <button type="button" onClick={() => void handleSaveToken()} disabled={saving || !tokenDraft.trim()}
                  className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                  {saving ? 'Guardando…' : 'Reemplazar token'}
                </button>
                <p className="text-xs text-gray-400 leading-relaxed">El token se guarda de forma segura y nunca se muestra nuevamente.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <MpStepper
          tokenDraft={tokenDraft} tokenError={tokenError} showToken={showToken} saving={saving}
          onTokenChange={v => { setTokenDraft(v); setTokenError('') }}
          onToggleShow={() => setShowToken(v => !v)}
          onSave={() => void handleSaveToken()}
        />
      )}

      {/* Modal desconexión */}
      <Modal isOpen={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} title="¿Desconectar Mercado Pago?">
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Si desconectás la cuenta, los pagos online del evento dejarán de procesarse hasta que conectes un nuevo token. Esta acción no afecta los pedidos ya cobrados.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => setConfirmDisconnect(false)}
            className="flex-1 rounded-full border border-gray-200 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => void handleRemoveToken()}
            className="flex-1 rounded-full bg-red-500 text-white text-sm font-semibold py-3 hover:bg-red-600 transition-colors">
            Desconectar
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── TokenInput ─────────────────────────────────────────────────────────────

function TokenInput({ value, onChange, show, onToggleShow, error }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggleShow: () => void; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          className={`${monoInputClass} ${error ? 'border-red-300 focus:ring-red-400' : ''}`}
          style={{ paddingRight: '42px' }}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="APP_USR-..."
          autoComplete="off"
        />
        <button type="button" onClick={onToggleShow} tabIndex={-1}
          aria-label={show ? 'Ocultar token' : 'Mostrar token'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
