'use client'

import { Check, Mail, Megaphone, Monitor, Search, Send, Smartphone, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { fullDateTime } from '@/components/organizer/orders/orderUi'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import {
  countAnnouncementAudience,
  createAnnouncement,
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchAnnouncement,
  fetchAnnouncements,
  fetchTickets,
  previewAnnouncement,
  sendTestAnnouncement,
  type AnnouncementAudienceType,
  type AnnouncementContent,
  type AnnouncementDefaults,
  type AnnouncementStatus,
  type WorkspaceAnnouncement,
} from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

type Option = { id: string; name: string; hint?: string }

const AUDIENCES: { key: AnnouncementAudienceType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'products', label: 'Por producto' },
  { key: 'categories', label: 'Por categoría' },
  { key: 'tickets', label: 'Por ticket' },
]

const ACCENT_PRESETS = ['#111111', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#caff00']

const STATUS_UI: Record<AnnouncementStatus, { label: string; className: string; dot: string }> = {
  sending: { label: 'Enviando', className: 'bg-blue-50 text-blue-800', dot: 'bg-blue-500 animate-pulse' },
  sent: { label: 'Enviado', className: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  partial: { label: 'Envío parcial', className: 'bg-amber-50 text-amber-800', dot: 'bg-amber-400' },
  failed: { label: 'Falló', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <p className="text-[14px] font-semibold text-gray-900">{title}</p>
      {description ? <p className="mt-0.5 text-[12px] text-gray-500">{description}</p> : null}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-gray-700">{label}</span>
        {hint ? <span className="text-[11px] text-gray-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left"
    >
      <span className="text-[13px] text-gray-700">{label}</span>
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-gray-900' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}

function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const ui = STATUS_UI[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        ui.className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', ui.dot)} aria-hidden />
      {ui.label}
    </span>
  )
}

function compradores(n: number) {
  return `${n.toLocaleString('es-AR')} ${n === 1 ? 'comprador' : 'compradores'}`
}

/** Herramienta "Avisos": e-mails del organizador a sus compradores (todos o un segmento). */
export function AnnouncementsView({ eventId }: { eventId: string }) {
  const { show, ToastPortal } = useToast()

  const [defaults, setDefaults] = useState<AnnouncementDefaults | null>(null)
  const [history, setHistory] = useState<WorkspaceAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [options, setOptions] = useState<Record<Exclude<AnnouncementAudienceType, 'all'>, Option[]>>({
    products: [],
    categories: [],
    tickets: [],
  })
  const [audienceType, setAudienceType] = useState<AnnouncementAudienceType>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [optionQuery, setOptionQuery] = useState('')
  const [audienceCount, setAudienceCount] = useState<number | null>(null)

  const [content, setContent] = useState<AnnouncementContent>({
    subject: '',
    title: '',
    body: '',
    ctaLabel: 'Ver catálogo',
    ctaUrl: '',
    accentColor: '#111111',
    showCover: true,
    greetByName: true,
  })
  const [ctaEnabled, setCtaEnabled] = useState(true)

  const [previewHtml, setPreviewHtml] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [sendingTest, setSendingTest] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const patch = (p: Partial<AnnouncementContent>) => setContent(prev => ({ ...prev, ...p }))

  /** Lo que se manda al backend: sin botón, el texto y el link van vacíos. */
  const payload = useMemo<AnnouncementContent>(
    () => (ctaEnabled ? content : { ...content, ctaLabel: '', ctaUrl: '' }),
    [content, ctaEnabled],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [ann, prods, cats, tix] = await Promise.all([
        fetchAnnouncements(eventId),
        fetchAllWorkspaceProducts(eventId),
        fetchAllCategories(eventId),
        fetchTickets(eventId),
      ])
      if (!ann.ok) {
        setLoadError(ann.error)
        return
      }
      setHistory(ann.announcements)
      setDefaults(ann.defaults)
      setContent(prev => ({
        ...prev,
        accentColor: ann.defaults.accentColor,
        ctaUrl: prev.ctaUrl || ann.defaults.storefrontUrl,
        showCover: ann.defaults.hasCover,
      }))
      setOptions({
        products: prods.ok
          ? prods.products.map(p => ({ id: p.id, name: p.name, hint: p.category_name ?? undefined }))
          : [],
        categories: cats.ok ? cats.categories.map(c => ({ id: c.id, name: c.name })) : [],
        tickets: tix.ok ? tix.tickets.map(t => ({ id: t.id, name: t.name })) : [],
      })
    } catch {
      setLoadError('No se pudieron cargar los avisos')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [load])

  // Cantidad de destinatarios para la selección actual.
  useEffect(() => {
    if (loading) return
    let cancelled = false
    const id = window.setTimeout(() => {
      if (audienceType !== 'all' && selectedIds.length === 0) {
        setAudienceCount(0)
        return
      }
      setAudienceCount(null)
      void countAnnouncementAudience(eventId, { type: audienceType, ids: selectedIds })
        .then(res => {
          if (!cancelled) setAudienceCount(res.ok ? res.count : 0)
        })
        .catch(() => {
          if (!cancelled) setAudienceCount(0)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [eventId, audienceType, selectedIds, loading])

  // Vista previa renderizada por el backend (debounce mientras se escribe).
  useEffect(() => {
    if (loading) return
    let cancelled = false
    const id = window.setTimeout(() => {
      void previewAnnouncement(eventId, payload)
        .then(res => {
          if (!cancelled && res.ok) setPreviewHtml(res.html)
        })
        .catch(() => {
          /* se mantiene la última vista previa */
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [eventId, payload, loading])

  // Progreso de los avisos que se están enviando.
  const sendingIds = history.filter(a => a.status === 'sending').map(a => a.id).join(',')
  useEffect(() => {
    if (!sendingIds) return
    const id = window.setInterval(() => {
      for (const annId of sendingIds.split(',')) {
        void fetchAnnouncement(eventId, annId)
          .then(res => {
            if (!res.ok) return
            setHistory(prev => prev.map(a => (a.id === annId ? res.announcement : a)))
          })
          .catch(() => {
            /* reintenta en el próximo tick */
          })
      }
    }, 2000)
    return () => window.clearInterval(id)
  }, [eventId, sendingIds])

  const visibleOptions = useMemo(() => {
    if (audienceType === 'all') return []
    const q = optionQuery.trim().toLowerCase()
    const list = options[audienceType]
    return q ? list.filter(o => o.name.toLowerCase().includes(q)) : list
  }, [audienceType, optionQuery, options])

  const toggleOption = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const formError = (() => {
    if (!content.subject.trim()) return 'Escribí el asunto'
    if (!content.title.trim()) return 'Escribí el título'
    if (!content.body.trim()) return 'Escribí el mensaje'
    if (ctaEnabled && (!content.ctaLabel.trim() || !/^https?:\/\//i.test(content.ctaUrl.trim())))
      return 'Completá el botón con un link que empiece con https://'
    return ''
  })()
  const sendingNow = history.some(a => a.status === 'sending')
  const canSend = !formError && !!audienceCount && !sendingNow

  const onSendTest = async () => {
    if (formError) {
      show(formError, 'error')
      return
    }
    setSendingTest(true)
    try {
      const res = await sendTestAnnouncement(eventId, payload)
      if (!res.ok) show(res.error, 'error')
      else show(`Te mandamos una prueba a ${res.email}`, 'success')
    } catch {
      show('No se pudo enviar la prueba', 'error')
    } finally {
      setSendingTest(false)
    }
  }

  const onConfirmSend = async () => {
    setSubmitting(true)
    try {
      const res = await createAnnouncement(eventId, {
        ...payload,
        audience: { type: audienceType, ids: audienceType === 'all' ? [] : selectedIds },
      })
      if (!res.ok) {
        show(res.error, 'error')
        return
      }
      setHistory(prev => [res.announcement, ...prev])
      setConfirmOpen(false)
      show('Estamos enviando el aviso', 'success')
      setContent(prev => ({ ...prev, subject: '', title: '', body: '' }))
    } catch {
      show('No se pudo enviar el aviso', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !defaults) {
    return (
      <div className="mx-auto w-full max-w-[1180px]" aria-busy="true">
        <OrganizerToolHeading title="Avisos" description="Mandales un e-mail a tus compradores." />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[1180px]">
        <OrganizerToolHeading title="Avisos" description="Mandales un e-mail a tus compradores." />
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {loadError}
        </p>
      </div>
    )
  }

  const audienceSummary =
    audienceCount == null
      ? 'Calculando…'
      : audienceType !== 'all' && selectedIds.length === 0
        ? 'Elegí al menos una opción'
        : audienceCount === 0
          ? 'Ningún comprador con e-mail para esta selección'
          : `${compradores(audienceCount)} ${audienceCount === 1 ? 'va' : 'van'} a recibir este aviso`

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <OrganizerToolHeading
        title="Avisos"
        description="Mandales un e-mail a tus compradores: a todos o solo a los que compraron algo en particular."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="min-w-0 space-y-4">
          <Section title="Destinatarios" description="Solo compradores con pedidos pagados y e-mail cargado.">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Destinatarios">
              {AUDIENCES.map(a => (
                <button
                  key={a.key}
                  type="button"
                  role="tab"
                  aria-selected={audienceType === a.key}
                  onClick={() => {
                    setAudienceType(a.key)
                    setSelectedIds([])
                    setOptionQuery('')
                  }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                    audienceType === a.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {audienceType !== 'all' && (
              <div className="rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 border-b border-gray-100 px-3">
                  <Search size={14} className="shrink-0 text-gray-400" aria-hidden />
                  <input
                    value={optionQuery}
                    onChange={e => setOptionQuery(e.target.value)}
                    placeholder="Buscar…"
                    aria-label="Buscar opciones"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-[13px] outline-none placeholder:text-gray-400"
                  />
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="shrink-0 text-[12px] font-medium text-gray-500 hover:text-gray-900"
                    >
                      Limpiar ({selectedIds.length})
                    </button>
                  )}
                </div>
                <ul className="max-h-[220px] overflow-y-auto p-1.5">
                  {visibleOptions.length === 0 ? (
                    <li className="px-3 py-4 text-center text-[13px] text-gray-400">
                      {options[audienceType].length === 0 ? 'No hay opciones en este evento' : 'Sin resultados'}
                    </li>
                  ) : (
                    visibleOptions.map(o => {
                      const on = selectedIds.includes(o.id)
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => toggleOption(o.id)}
                            aria-pressed={on}
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                              on ? 'bg-gray-100' : 'hover:bg-gray-50',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded border',
                                on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300',
                              )}
                              aria-hidden
                            >
                              {on ? <Check size={11} strokeWidth={3} /> : null}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] text-gray-900">{o.name}</span>
                            {o.hint ? <span className="shrink-0 text-[11px] text-gray-400">{o.hint}</span> : null}
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700">
              <Users size={15} strokeWidth={1.75} className="shrink-0 text-gray-400" aria-hidden />
              <span className={cn(audienceCount == null && 'text-gray-400')}>{audienceSummary}</span>
            </div>
          </Section>

          <Section title="Mensaje">
            <Field label="Asunto" hint={`${content.subject.length}/200`}>
              <input
                value={content.subject}
                maxLength={200}
                onChange={e => patch({ subject: e.target.value })}
                placeholder="Ej: Cambió el horario de apertura"
                className={inputClass}
              />
            </Field>
            <Field label="Título">
              <input
                value={content.title}
                maxLength={200}
                onChange={e => patch({ title: e.target.value })}
                placeholder="Ej: Abrimos las puertas a las 22 hs"
                className={inputClass}
              />
            </Field>
            <Field label="Mensaje" hint="Dejá una línea en blanco para separar párrafos">
              <textarea
                value={content.body}
                maxLength={10000}
                onChange={e => patch({ body: e.target.value })}
                rows={7}
                placeholder="Contales a tus compradores lo que necesitan saber…"
                className={cn(inputClass, 'resize-y leading-relaxed')}
              />
            </Field>
            <Toggle
              checked={content.greetByName}
              onChange={v => patch({ greetByName: v })}
              label="Saludar por el nombre (¡Hola, Juan!)"
            />
          </Section>

          <Section title="Diseño">
            <div>
              <p className="mb-2 text-[12px] font-medium text-gray-700">Color</p>
              <div className="flex flex-wrap items-center gap-2">
                {Array.from(new Set([defaults?.accentColor ?? '#111111', ...ACCENT_PRESETS])).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ accentColor: c })}
                    aria-label={`Color ${c}`}
                    aria-pressed={content.accentColor === c}
                    className={cn(
                      'size-8 rounded-full border border-black/10 transition-transform hover:scale-105',
                      content.accentColor === c && 'ring-2 ring-gray-900 ring-offset-2',
                    )}
                    style={{ background: c }}
                  />
                ))}
                <label
                  className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 text-[11px] text-gray-500 hover:border-gray-500"
                  title="Otro color"
                >
                  +
                  <input
                    type="color"
                    value={content.accentColor}
                    onChange={e => patch({ accentColor: e.target.value })}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Elegir otro color"
                  />
                </label>
              </div>
            </div>
            {defaults?.hasCover ? (
              <Toggle
                checked={content.showCover}
                onChange={v => patch({ showCover: v })}
                label="Mostrar la portada del evento"
              />
            ) : null}
            <Toggle checked={ctaEnabled} onChange={setCtaEnabled} label="Agregar un botón" />
            {ctaEnabled && (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <Field label="Texto del botón">
                  <input
                    value={content.ctaLabel}
                    maxLength={60}
                    onChange={e => patch({ ctaLabel: e.target.value })}
                    placeholder="Ver catálogo"
                    className={inputClass}
                  />
                </Field>
                <Field label="Link">
                  <input
                    value={content.ctaUrl}
                    onChange={e => patch({ ctaUrl: e.target.value })}
                    placeholder="https://"
                    inputMode="url"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </Section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => void onSendTest()}
              disabled={sendingTest}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Mail size={14} strokeWidth={1.75} aria-hidden />
              {sendingTest ? 'Enviando prueba…' : 'Enviarme una prueba'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
              title={sendingNow ? 'Hay un aviso enviándose' : formError || undefined}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              <Send size={14} strokeWidth={1.75} aria-hidden />
              {audienceCount ? `Enviar a ${compradores(audienceCount)}` : 'Enviar aviso'}
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-medium text-gray-500">Vista previa</p>
              <div className="flex rounded-full bg-gray-100 p-0.5" role="tablist" aria-label="Dispositivo">
                {(
                  [
                    ['desktop', Monitor, 'Escritorio'],
                    ['mobile', Smartphone, 'Celular'],
                  ] as const
                ).map(([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={previewDevice === key}
                    aria-label={label}
                    onClick={() => setPreviewDevice(key)}
                    className={cn(
                      'rounded-full px-2.5 py-1 transition-colors',
                      previewDevice === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
                    )}
                  >
                    <Icon size={14} strokeWidth={1.75} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-[#f4f4f5]">
              <div className="border-b border-gray-200/80 bg-white px-4 py-3">
                <p className="truncate text-[13px] font-semibold text-gray-900">
                  {content.subject.trim() || 'Asunto del aviso'}
                </p>
                <p className="truncate text-[12px] text-gray-500">Para: {audienceSummary.toLowerCase()}</p>
              </div>
              <div className="flex justify-center">
                <iframe
                  title="Vista previa del e-mail"
                  srcDoc={previewHtml}
                  sandbox=""
                  className={cn(
                    'h-[640px] border-0 bg-[#f4f4f5] transition-[width]',
                    previewDevice === 'mobile' ? 'w-[375px] max-w-full' : 'w-full',
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="mb-3 text-[14px] font-semibold text-gray-900">Avisos enviados</p>
        {history.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Megaphone size={20} strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-[15px] font-semibold text-gray-900">Todavía no enviaste avisos</p>
            <p className="mt-1 text-[13px] text-gray-500">Los avisos que mandes van a aparecer acá con su estado.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map(a => {
              const done = a.sentCount + a.failedCount
              const pct = a.recipientCount ? Math.round((done / a.recipientCount) * 100) : 0
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full border border-black/10"
                      style={{ background: a.accentColor }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-gray-900">{a.subject}</p>
                      <p className="truncate text-[12px] text-gray-500">{a.audienceLabel}</p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-[12px] text-gray-500">{fullDateTime(a.createdAt)}</p>
                      <p className="text-[12px] text-gray-400 tabular-nums">
                        {a.sentCount.toLocaleString('es-AR')} / {a.recipientCount.toLocaleString('es-AR')} enviados
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.status === 'sending' && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {a.failedCount > 0 && a.status !== 'sending' && (
                    <p className="mt-2 text-[12px] text-red-600">
                      {a.failedCount.toLocaleString('es-AR')} no se pudieron enviar.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal isOpen={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} title="¿Enviar el aviso?">
        <p className="text-[14px] leading-relaxed text-gray-600">
          Vas a enviar <span className="font-semibold text-gray-900">“{content.subject.trim()}”</span> a{' '}
          <span className="font-semibold text-gray-900">{compradores(audienceCount ?? 0)}</span>. Una vez enviado no se
          puede deshacer.
        </p>
        {defaults?.ownerEmail ? (
          <p className="mt-2 text-[12px] text-gray-500">Las respuestas te llegan a {defaults.ownerEmail}.</p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={submitting}
            className="rounded-full px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirmSend()}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Send size={14} strokeWidth={1.75} aria-hidden />
            {submitting ? 'Enviando…' : 'Enviar ahora'}
          </button>
        </div>
      </Modal>

      <ToastPortal />
    </div>
  )
}
