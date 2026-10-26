'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ToggleSwitch } from '@/components/organizer/BlocksView'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ticketsPath } from '@/lib/buyerRoutes'
import { usePublicOrigin } from '@/lib/hooks/usePublicOrigin'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import {
  createTicket,
  deleteTicket,
  fetchTickets,
  patchTicket,
  type WorkspaceTicket,
} from '@/lib/organizerWorkspace'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { formatPrice } from '@/lib/utils'

type FormState = { name: string; description: string; price: string; stock: string }

const EMPTY_FORM: FormState = { name: '', description: '', price: '', stock: '' }

const inputClass =
  'nb-input w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#0A0A0F] outline-none transition-colors'

export function TicketsView({ eventId }: { eventId: string }) {
  const [tickets, setTickets] = useState<WorkspaceTicket[]>([])
  const [eventSlug, setEventSlug] = useState('')
  const [hasCover, setHasCover] = useState(true)
  const [copied, setCopied] = useState(false)
  const origin = usePublicOrigin()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<WorkspaceTicket | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [togglePending, setTogglePending] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false
    fetchOrganizerEventDetail(eventId).then(res => {
      if (cancelled || !res.ok) return
      setEventSlug(res.event.slug)
      setHasCover(Boolean(res.event.cover_image_url))
    })
    fetchTickets(eventId).then(res => {
      if (cancelled) return
      if (!res.ok) setError(res.error)
      else setTickets(res.tickets)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (t: WorkspaceTicket) => {
    setEditingId(t.id)
    setForm({ name: t.name, description: t.description, price: String(t.price), stock: t.stock == null ? '' : String(t.stock) })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (saving) return
    const name = form.name.trim()
    const price = Number(form.price.replace(',', '.'))
    if (name.length < 2) { setFormError('Ingresá un nombre (ej. Entrada general, Parking VIP)'); return }
    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) { setFormError('Ingresá un precio válido'); return }

    // Stock opcional: vacío = sin límite.
    const stockText = form.stock.trim()
    const stock = stockText === '' ? null : Number(stockText)
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) { setFormError('El stock debe ser un número entero (o dejalo vacío para no limitarlo)'); return }

    setSaving(true)
    setFormError('')
    const payload = { name, description: form.description.trim(), price, stock }
    const res = editingId
      ? await patchTicket(eventId, editingId, payload)
      : await createTicket(eventId, payload)
    setSaving(false)
    if (!res.ok) { setFormError(res.error); return }
    setTickets(list =>
      editingId ? list.map(x => (x.id === res.ticket.id ? res.ticket : x)) : [...list, res.ticket],
    )
    closeForm()
  }

  const toggleActive = async (t: WorkspaceTicket) => {
    if (togglePending.has(t.id)) return
    const next = !t.is_active
    setTogglePending(s => new Set(s).add(t.id))
    setTickets(list => list.map(x => (x.id === t.id ? { ...x, is_active: next } : x)))
    const res = await patchTicket(eventId, t.id, { is_active: next })
    if (!res.ok) {
      setTickets(list => list.map(x => (x.id === t.id ? { ...x, is_active: t.is_active } : x)))
      setError(res.error)
    } else {
      setTickets(list => list.map(x => (x.id === t.id ? res.ticket : x)))
    }
    setTogglePending(s => {
      const n = new Set(s)
      n.delete(t.id)
      return n
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteSubmitting) return
    setDeleteSubmitting(true)
    const res = await deleteTicket(eventId, deleteTarget.id)
    setDeleteSubmitting(false)
    if (!res.ok) setError(res.error)
    else setTickets(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const publicUrl = eventSlug && origin ? `${origin}${ticketsPath(eventSlug)}` : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('No se pudo copiar. Copiá el enlace manualmente.')
    }
  }

  if (loading) {
    return (
      <div className="w-full min-w-0 flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando tickets…</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-none" style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`.nb-input:focus { border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }`}</style>

      <OrganizerToolHeading
        title="Tickets"
        description="Vendé entradas, parking o lo que quieras con categorías y precios propios. Aparecen en el catálogo como una sección aparte."
        actions={
          <button
            type="button"
            onClick={openCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Nuevo ticket
          </button>
        }
      />

      {publicUrl && (
        <div className="mb-5 rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Link de tickets para compartir</p>
          <p className="mt-1.5 break-all font-mono text-sm text-gray-800">{publicUrl}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Abrir
            </a>
          </div>
          {!hasCover && (
            <p className="mt-2 text-xs text-amber-700">
              Este evento todavía no tiene portada: el link no va a estar disponible hasta que la cargues en Storefront.
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Todavía no hay tickets</p>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: '0 0 24px 0' }}>Creá el primero, por ejemplo “Entrada general” o “Parking VIP”.</p>
          <button
            type="button"
            onClick={openCreate}
            style={{ ...organizerAccentFilledButtonStyle(), border: 'none', borderRadius: '100px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Crear ticket
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tickets.map(t => (
            <li
              key={t.id}
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: t.is_active ? 1 : 0.6 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{t.name}</p>
                    {!t.is_active && (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: '#9A9AA8', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Pausado</span>
                    )}
                  </div>
                  {t.description && (
                    <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '4px 0 0 0' }} className="line-clamp-2">{t.description}</p>
                  )}
                </div>
                <ToggleSwitch checked={t.is_active} disabled={togglePending.has(t.id)} onChange={() => toggleActive(t)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0F', margin: 0, letterSpacing: '-0.02em' }}>{formatPrice(t.price, t.currency)}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, color: t.stock != null && t.sold >= t.stock ? '#DC2626' : '#9A9AA8' }}>
                  {t.stock == null
                    ? `${t.sold} vendidos`
                    : t.sold >= t.stock
                      ? `Agotado · ${t.sold}/${t.stock}`
                      : `${t.sold}/${t.stock} vendidos`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(t)}
                  aria-label={`Eliminar ${t.name}`}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#C8C8D0', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M2 3.5h10M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1M3.5 3.5l.75 7.5h5.5l.75-7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={formOpen} onClose={closeForm} title={editingId ? 'Editar ticket' : 'Nuevo ticket'}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Nombre / categoría
            <input
              className={inputClass}
              value={form.name}
              maxLength={150}
              placeholder="Entrada general, Parking VIP…"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Descripción <span className="font-normal text-gray-400">(opcional)</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Precio (ARS)
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={form.price}
              placeholder="0"
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Stock máximo <span className="font-normal text-gray-400">(opcional)</span>
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.stock}
              placeholder="Sin límite"
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
            />
          </label>
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ ...organizerAccentFilledButtonStyle(), border: 'none', borderRadius: '100px', padding: '8px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Eliminar ticket">
        <p className="text-sm text-gray-600">
          ¿Eliminar “{deleteTarget?.name}”? Los pedidos que ya lo compraron no se modifican.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleteSubmitting}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {deleteSubmitting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
