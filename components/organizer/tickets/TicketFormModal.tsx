'use client'

import { useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import type { TicketKind, WorkspaceTicket } from '@/lib/organizerWorkspace'
import { DEFAULT_PARKING_ICON, PARKING_ICONS } from '@/lib/parkingIcons'
import { cn } from '@/lib/utils'

import { TicketCard } from './TicketCard'

export type TicketFormState = { name: string; description: string; price: string; stock: string; icon: string }

export const EMPTY_TICKET_FORM: TicketFormState = { name: '', description: '', price: '', stock: '', icon: DEFAULT_PARKING_ICON }

export type TicketPayload = { name: string; description: string; price: number; stock: number | null; icon?: string }

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]'

/** Valida el formulario; devuelve el payload o el mensaje de error. */
export function parseTicketForm(
  form: TicketFormState,
  kind: TicketKind = 'ticket',
): { ok: true; payload: TicketPayload } | { ok: false; error: string } {
  const name = form.name.trim()
  const price = Number(form.price.replace(',', '.'))
  if (name.length < 2) {
    return {
      ok: false,
      error: kind === 'parking' ? 'Ingresá el tipo de vehículo (ej. Auto, Moto)' : 'Ingresá un nombre (ej. Entrada general, Parking VIP)',
    }
  }
  if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) return { ok: false, error: 'Ingresá un precio válido' }
  // Stock opcional: vacío = sin límite.
  const stockText = form.stock.trim()
  const stock = stockText === '' ? null : Number(stockText)
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    return { ok: false, error: 'El stock debe ser un número entero (o dejalo vacío para no limitarlo)' }
  }
  const payload: TicketPayload = { name, description: form.description.trim(), price, stock }
  if (kind === 'parking') payload.icon = form.icon || DEFAULT_PARKING_ICON
  return { ok: true, payload }
}

export function TicketFormModal({
  open,
  kind = 'ticket',
  editing,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean
  /** Entrada o parking: cambia los textos y muestra el selector de ícono del vehículo. */
  kind?: TicketKind
  /** Ticket que se edita (para mostrar lo vendido en la vista previa); null al crear. */
  editing: WorkspaceTicket | null
  initial: TicketFormState
  onClose: () => void
  onSubmit: (payload: TicketPayload) => Promise<string | null>
}) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // El modal se reutiliza: al abrirlo con otro ticket o plantilla se reinicia el formulario.
  const [seed, setSeed] = useState(initial)
  if (seed !== initial) {
    setSeed(initial)
    setForm(initial)
    setError('')
  }

  const submit = async () => {
    if (saving) return
    const parsed = parseTicketForm(form, kind)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setSaving(true)
    setError('')
    const err = await onSubmit(parsed.payload)
    setSaving(false)
    if (err) setError(err)
  }

  const previewPrice = Number(form.price.replace(',', '.'))
  const previewStock = form.stock.trim() === '' ? null : Number(form.stock)
  const isParking = kind === 'parking'
  const preview = {
    kind,
    icon: form.icon,
    name: form.name,
    description: form.description,
    price: Number.isFinite(previewPrice) ? previewPrice : 0,
    stock: previewStock != null && Number.isFinite(previewStock) ? previewStock : null,
    sold: editing?.sold ?? 0,
    reserved: editing?.reserved,
    is_active: editing?.is_active ?? true,
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isParking ? (editing ? 'Editar vehículo' : 'Nuevo vehículo') : editing ? 'Editar ticket' : 'Nuevo ticket'}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4" onKeyDown={onEnter}>
        <div className="rounded-2xl bg-gray-50 p-3 [--nb-notch:#f9fafb]">
          <TicketCard ticket={preview} />
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
          {isParking ? 'Tipo de vehículo' : 'Nombre / categoría'}
          <input
            className={inputClass}
            value={form.name}
            maxLength={150}
            autoFocus
            placeholder={isParking ? 'Auto, Moto, Camioneta…' : 'Entrada general, Parking VIP…'}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </label>
        {isParking && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-gray-700">Ícono</legend>
            <div role="radiogroup" aria-label="Ícono del vehículo" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PARKING_ICONS.map(({ key, label, Icon }) => {
                const selected = form.icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm(f => ({ ...f, icon: key }))}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-medium transition-colors',
                      selected
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900',
                    )}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
          <span>
            Descripción <span className="font-normal text-gray-400">(opcional)</span>
          </span>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            placeholder={isParking ? 'Medidas máximas, techado, horario…' : 'Qué incluye, horario de ingreso, edad mínima…'}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
            Precio
            <span className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">$</span>
              <input
                className={`${inputClass} pl-7 tabular-nums`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.price}
                placeholder="0"
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
            <span>
              {isParking ? 'Lugares' : 'Cupo'} <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <input
              className={`${inputClass} tabular-nums`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.stock}
              placeholder="Sin límite"
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
            />
          </label>
        </div>
        {editing && (editing.reserved ?? editing.sold) > 0 && (
          <p className="-mt-2 text-[12px] text-gray-400">Ya hay {editing.reserved ?? editing.sold} vendidas o reservadas: {isParking ? 'los lugares' : 'el cupo'} no pueden ser menos.</p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            style={organizerAccentFilledButtonStyle()}
            className="rounded-xl px-5 py-2 text-[14px] font-semibold transition-[filter,opacity] hover:brightness-95 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
