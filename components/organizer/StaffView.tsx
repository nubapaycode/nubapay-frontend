'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'
import {
  deleteEventStaff,
  fetchEventStaffList,
  inviteEventStaff,
  patchEventStaff,
  resendEventStaffInviteEmail,
  type EventStaffRow,
} from '@/lib/organizerStaff'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Íconos SVG por herramienta
// ---------------------------------------------------------------------------
type IconProps = { size?: number }

function IcDashboard({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
      <rect x="0" y="7" width="3" height="5" rx="0.6" />
      <rect x="4.5" y="4" width="3" height="8" rx="0.6" />
      <rect x="9" y="1.5" width="3" height="10.5" rx="0.6" />
    </svg>
  )
}

function IcStorefront({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h10M2.5 5 3.5 2h5l1 3" />
      <rect x="1" y="5" width="10" height="6" rx="0.8" />
      <path d="M4.5 11V8h3v3" />
    </svg>
  )
}

function IcProducts({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1L11 3.5v5L6 11 1 8.5v-5L6 1z" />
      <path d="M6 1v10M1 3.5l5 3 5-3" />
    </svg>
  )
}

function IcScanner({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
    </svg>
  )
}

function IcOrders({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
      <rect x="2" y="1" width="8" height="10" rx="1" />
      <path d="M4.5 4.5h3M4.5 6.5h3M4.5 8.5h1.5" />
    </svg>
  )
}

function IcPickupPoints({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7 6 11 6 11S2.5 7 2.5 4.5A3.5 3.5 0 016 1z" />
      <circle cx="6" cy="4.5" r="1.3" />
    </svg>
  )
}

function IcPayments({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
      <rect x="1" y="2.5" width="10" height="7" rx="1" />
      <path d="M1 5.5h10" />
      <rect x="3" y="7.5" width="2.5" height="1" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Mapa de herramientas
// ---------------------------------------------------------------------------
type ToolOpt = {
  key: keyof OrganizerStaffTools
  label: string
  short: string
  Icon: React.FC<IconProps>
}

const TOOL_OPTS: ToolOpt[] = [
  { key: 'dashboard',     label: 'Dashboard / métricas', short: 'Dashboard',  Icon: IcDashboard     },
  { key: 'products',      label: 'Catálogo y promos',     short: 'Catálogo',   Icon: IcProducts      },
  { key: 'scanner',       label: 'Escáner QR',            short: 'Escáner',    Icon: IcScanner       },
  { key: 'orders',        label: 'Pedidos',               short: 'Pedidos',    Icon: IcOrders        },
  { key: 'pickup_points', label: 'Puntos de retiro',      short: 'Retiro',     Icon: IcPickupPoints  },
  { key: 'payments',      label: 'Pagos',                 short: 'Pagos',      Icon: IcPayments      },
]

const AVATAR_PALETTES = [
  { bg: '#E8F4FD', fg: '#2E7BAA' },
  { bg: '#FEF3C7', fg: '#92650A' },
  { bg: '#F0FDF4', fg: '#16803A' },
  { bg: '#FDF2F8', fg: '#9D174D' },
  { bg: '#F5F3FF', fg: '#5B21B6' },
  { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#ECFEFF', fg: '#0E7490' },
  { bg: '#FFF1F2', fg: '#BE123C' },
]

function defaultTools(): OrganizerStaffTools {
  return { ...ORGANIZER_ZERO_TOOLS, orders: true, scanner: true }
}

function avatarPalette(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length]
}

function avatarInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ---------------------------------------------------------------------------
// ToolChip — pill pequeño con ícono para las cards
// ---------------------------------------------------------------------------
function ToolChip({ tool }: { tool: ToolOpt }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-600">
      <tool.Icon size={11} />
      {tool.short}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ToolToggle — pill grande con ícono para formularios y modales
// ---------------------------------------------------------------------------
function ToolToggle({
  tool,
  checked,
  onChange,
  disabled,
  compact,
}: {
  tool: ToolOpt
  checked: boolean
  onChange: () => void
  disabled?: boolean
  compact?: boolean
}) {
  const { Icon } = tool
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 rounded-xl cursor-pointer select-none transition-all text-sm font-medium',
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        checked
          ? 'bg-[#C6FF00] text-[#0A0F00] shadow-[0_1px_3px_rgba(0,0,0,0.10)]'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <span
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded transition-colors',
          checked ? 'text-[#0A0F00]' : 'text-gray-400',
        )}
      >
        <Icon size={compact ? 11 : 13} />
      </span>
      <span className={compact ? 'text-[12px]' : 'text-[13px]'}>{tool.label}</span>
      {checked && (
        <span className="ml-auto flex-shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#0A0F00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </label>
  )
}

// ---------------------------------------------------------------------------
// ConfirmModal
// ---------------------------------------------------------------------------
function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', busy,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmLabel?: string; busy?: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} containerClassName="z-[60]">
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 6v3.5M8 11.5v.5" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M6.8 2.5l-5.5 9.5A1.4 1.4 0 002.5 14h11a1.4 1.4 0 001.2-2l-5.5-9.5a1.4 1.4 0 00-2.4 0z" stroke="#DC2626" strokeWidth="1.3" fill="none" />
          </svg>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-0.5">{title}</h2>
          <p className="text-[13px] text-gray-500 leading-snug">{message}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button" onClick={onClose} disabled={busy}
          className="text-[13px] font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button" onClick={onConfirm} disabled={busy}
          className="text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
        >
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// EditStaffModal
// ---------------------------------------------------------------------------
function EditStaffModal({
  isOpen, onClose, eventId, row, onUpdated, onError, onSuccess, onRemoveRequest,
}: {
  isOpen: boolean; onClose: () => void; eventId: string; row: EventStaffRow
  onUpdated: () => void; onError: (m: string) => void; onSuccess: (m: string) => void
  onRemoveRequest: () => void
}) {
  const [tools, setTools]     = useState<OrganizerStaffTools>(row.tools)
  const [role, setRole]       = useState(row.role)
  const [busy, setBusy]       = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'busy'>('idle')

  useEffect(() => {
    if (isOpen) { setTools(row.tools); setRole(row.role); setResendState('idle') }
  }, [isOpen, row])

  const toggle = (k: keyof OrganizerStaffTools) => setTools(t => ({ ...t, [k]: !t[k] }))

  const save = async () => {
    if (!Object.values(tools).some(Boolean)) { onError('Al menos una herramienta debe estar activa'); return }
    setBusy(true)
    try {
      const res = await patchEventStaff(eventId, row.id, { role, tools })
      if (!res.ok) { onError(res.error); return }
      onUpdated(); onSuccess('Permisos actualizados'); onClose()
    } catch { onError('Error al guardar') }
    finally { setBusy(false) }
  }

  const resend = async () => {
    setResendState('busy')
    try {
      const res = await resendEventStaffInviteEmail(eventId, row.id)
      if (!res.ok) { onError(res.detail ? `${res.error}: ${res.detail}` : res.error); setResendState('idle'); return }
      onSuccess(res.email_sent ? 'Correo de acceso reenviado.' : 'Cuenta actualizada, pero el email no se envió. Revisá el log.')
      setResendState('idle')
    } catch { onError('No se pudo reenviar el email'); setResendState('idle') }
  }

  const palette = avatarPalette(row.name)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header con avatar + reenviar email discreto */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-black/[0.06]">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 ring-white shadow-sm"
          style={{ background: palette.bg, color: palette.fg }}
        >
          {avatarInitials(row.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[14px] text-gray-900 truncate leading-tight">{row.name}</p>
          <p className="text-[12px] text-gray-400 truncate">{row.email}</p>
        </div>
        {/* Reenviar email — acción utilitaria discreta */}
          <button
            type="button"
            onClick={resend}
            disabled={resendState === 'busy' || busy}
            className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-black/10 rounded-full px-3.5 py-1.5 hover:border-black/20 hover:text-gray-800 transition-colors disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M7 5.5a2.8 2.8 0 00-4 0L1.5 7a2.8 2.8 0 004 4L6.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 6.5a2.8 2.8 0 004 0L10.5 5a2.8 2.8 0 00-4-4L5.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {resendState === 'busy' ? 'Enviando…' : 'Reenviar acceso'}
          </button>
      </div>

      {/* Rol */}
      <div className="mb-4">
        <label className="block text-[10.5px] font-semibold text-gray-400  mb-1.5">
          Rol en el evento
        </label>
        <input
          type="text" value={role} onChange={e => setRole(e.target.value)}
          placeholder="Ej. Caja, Producción, Prensa"
          className="w-full rounded-xl border border-black/10 bg-gray-50 px-3 py-2.5 text-[13px] text-[#0A0A0F] outline-none focus:border-black/25 transition-colors placeholder:text-gray-400 disabled:opacity-50"
          disabled={busy}
        />
      </div>

      {/* Herramientas */}
      <div className="mb-5">
        <p className="text-[10.5px] font-semibold text-gray-400  mb-2">
          Herramientas
        </p>
        <div className="flex flex-col gap-1">
          {TOOL_OPTS.map(tool => (
            <ToolToggle key={tool.key} tool={tool} checked={tools[tool.key]} onChange={() => toggle(tool.key)} disabled={busy} compact />
          ))}
        </div>
      </div>

      {/* Botones principales */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={onClose} disabled={busy}
          className="flex-1 text-[13px] font-medium text-gray-600 rounded-xl border border-black/10 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={busy}
          className="flex-1 text-[13px] font-semibold text-white bg-[#0A0A0F] rounded-xl py-2.5 disabled:opacity-50 hover:bg-gray-800 transition-colors">
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* Quitar del equipo */}
      <button
        type="button"
        onClick={() => { onClose(); onRemoveRequest() }}
        disabled={busy}
        className="w-full text-[12.5px] font-medium text-red-500 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-40"
      >
        Quitar del equipo
      </button>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// StaffRow — fila de tabla para un integrante
// ---------------------------------------------------------------------------
function StaffRow({ row, onEdit }: { row: EventStaffRow; onEdit: () => void }) {
  const activeTools = TOOL_OPTS.filter(o => row.tools[o.key])
  const palette = avatarPalette(row.name)

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: palette.bg, color: palette.fg }}
          >
            {avatarInitials(row.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[13px] text-gray-900 leading-tight truncate">{row.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{row.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        {row.role ? (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 whitespace-nowrap">
            {row.role}
          </span>
        ) : (
          <span className="text-gray-300 text-[13px]">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-wrap gap-1">
          {activeTools.length === 0 ? (
            <span className="text-[11px] text-gray-300 italic">Sin herramientas</span>
          ) : (
            activeTools.map(tool => <ToolChip key={tool.key} tool={tool} />)
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <button
          type="button"
          onClick={onEdit}
          className="text-[11.5px] font-medium text-gray-400 border border-black/[0.09] rounded-full px-3 py-1.5 hover:bg-[#0A0A0F] hover:text-white hover:border-[#0A0A0F] transition-all whitespace-nowrap"
        >
          Editar
        </button>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// InviteModal
// ---------------------------------------------------------------------------
function InviteModal({
  isOpen, onClose, eventId, onInvited, onSuccess, onError,
}: {
  isOpen: boolean; onClose: () => void; eventId: string; onInvited: () => void
  onSuccess: (m: string) => void; onError: (m: string) => void
}) {
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [role, setRole]       = useState('')
  const [tools, setTools]     = useState<OrganizerStaffTools>(defaultTools)
  const [saving, setSaving]   = useState(false)
  const [formErr, setFormErr] = useState('')

  const toggleTool = (k: keyof OrganizerStaffTools) => setTools(t => ({ ...t, [k]: !t[k] }))

  const invite = async () => {
    setFormErr('')
    if (name.trim().length < 2) { setFormErr('Nombre obligatorio (mín. 2 caracteres)'); return }
    if (!email.includes('@'))   { setFormErr('Email inválido'); return }
    if (!Object.values(tools).some(Boolean)) { setFormErr('Elegí al menos una herramienta'); return }
    setSaving(true)
    try {
      const res = await inviteEventStaff(eventId, {
        email: email.trim().toLowerCase(),
        name:  name.trim(),
        role:  role.trim() || 'Integrante',
        tools,
      })
      if (!res.ok) { setFormErr(res.detail ? `${res.error}: ${res.detail}` : res.error); return }
      if (!res.email_sent) {
        onError('Integrante agregado, pero el email no se envió. Revisá el log del backend.')
      } else {
        onSuccess(`Invitación enviada a ${email.trim().toLowerCase()}`)
      }
      onInvited()
      onClose()
    } catch { setFormErr('No se pudo enviar la invitación') }
    finally { setSaving(false) }
  }

  const inputClass = cn(
    'w-full rounded-xl border border-black/[0.09] bg-gray-50 px-3.5 py-2.5',
    'text-[13px] text-[#0A0A0F] placeholder:text-gray-400',
    'outline-none focus:border-black/25 focus:bg-white transition-all',
    'disabled:opacity-50',
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      {/* Header */}
      <div className="mb-5 pb-4 border-b border-black/[0.06]">
        <h2 className="text-[15px] font-semibold text-gray-900">Invitar integrante</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">Recibirán acceso por email con contraseña temporal si son nuevos en Nubapay.</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Nombre + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Nombre *" value={name}
            onChange={e => setName(e.target.value)} className={inputClass} disabled={saving} />
          <input type="email" placeholder="Email *" value={email}
            onChange={e => setEmail(e.target.value)} className={inputClass} disabled={saving} autoComplete="off" />
        </div>

        {/* Rol */}
        <input type="text" placeholder="Rol (ej. Caja, Producción, Scanner)"
          value={role} onChange={e => setRole(e.target.value)} className={inputClass} disabled={saving} />

        {/* Herramientas */}
        <div className="pt-1">
          <p className="text-[10.5px] font-semibold text-gray-400  mb-2">
            Herramientas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {TOOL_OPTS.map(tool => (
              <ToolToggle key={tool.key} tool={tool} checked={tools[tool.key]}
                onChange={() => toggleTool(tool.key)} disabled={saving} />
            ))}
          </div>
        </div>

        {/* Error */}
        {formErr && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <circle cx="7" cy="7" r="6" stroke="#DC2626" strokeWidth="1.3"/>
              <path d="M7 4.5v3M7 9.5v.5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="text-[12.5px] text-red-700">{formErr}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 mt-1">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 rounded-xl border border-black/10 text-[13px] font-medium text-gray-600 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={invite} disabled={saving}
            className="flex-1 rounded-xl bg-[#0A0A0F] text-white text-[13px] font-semibold py-2.5 disabled:opacity-50 hover:bg-gray-800 active:scale-[0.99] transition-all">
            {saving ? 'Enviando…' : 'Enviar invitación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// ToolFilterDropdown — selector custom, UI idéntica a NubaSelect del catálogo
// ---------------------------------------------------------------------------
function ToolFilterDropdown({
  value,
  onChange,
}: {
  value: keyof OrganizerStaffTools | ''
  onChange: (v: keyof OrganizerStaffTools | '') => void
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('mousedown', handleClick); window.removeEventListener('keydown', handleKey) }
  }, [open])

  const selected = TOOL_OPTS.find(t => t.key === value) ?? null

  const options = [
    { value: '' as const, label: 'Todos los permisos', Icon: null as null },
    ...TOOL_OPTS.map(t => ({ value: t.key, label: t.label, Icon: t.Icon })),
  ]

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: '180px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          borderRadius: '12px',
          border: '1px solid ' + (open ? '#0A0A0F' : 'rgba(0,0,0,0.1)'),
          background: '#FAFAFA',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#0A0A0F',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected
            ? <><selected.Icon size={13} />{selected.label}</>
            : 'Todos los permisos'
          }
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {selected && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '100px', background: 'rgba(0,0,0,0.08)', color: '#6B7280', cursor: 'pointer' }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#6B7280', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value || '__all__'}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value as keyof OrganizerStaffTools | ''); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected ? '#C6FF00' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  color: '#0A0A0F',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F5F5F7' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.Icon && <opt.Icon size={12} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.10] py-12 flex flex-col items-center text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="7" r="3.5" />
          <path d="M1.5 17c0-3 3-5 6.5-5s6.5 2 6.5 5" />
          <path d="M14 2.5a3.5 3.5 0 010 7M18.5 17c0-3-2-4.7-4.5-5" />
        </svg>
      </div>
      <p className="text-[13px] font-medium text-gray-500">Todavía no hay integrantes</p>
      <p className="text-[12px] text-gray-400">Usá el botón "Invitar integrante" para agregar el primero.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StaffView — raíz
// ---------------------------------------------------------------------------
export function StaffView({ eventId }: { eventId: string }) {
  const [rows, setRows]               = useState<EventStaffRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [listErr, setListErr]         = useState('')
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [search, setSearch]           = useState('')
  const [toolFilter, setToolFilter]   = useState<keyof OrganizerStaffTools | ''>('')
  const [editingRow, setEditingRow]   = useState<EventStaffRow | null>(null)
  const [confirmingRow, setConfirmingRow] = useState<EventStaffRow | null>(null)
  const [removeBusy, setRemoveBusy]   = useState(false)
  const { show, ToastPortal }         = useToast()

  const load = useCallback(async () => {
    setListErr(''); setLoading(true)
    try {
      const res = await fetchEventStaffList(eventId)
      if (!res.ok) { setListErr(res.error); return }
      setRows(res.staff)
    } catch { setListErr('Error de red') }
    finally { setLoading(false) }
  }, [eventId])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      const matchesTool   = !toolFilter || r.tools[toolFilter]
      return matchesSearch && matchesTool
    })
  }, [rows, search, toolFilter])

  const hasFilters = search.trim() !== '' || toolFilter !== ''

  const remove = async () => {
    if (!confirmingRow) return
    setRemoveBusy(true)
    try {
      const res = await deleteEventStaff(eventId, confirmingRow.id)
      if (!res.ok) { show(res.error, 'error'); return }
      setConfirmingRow(null)
      load()
    } catch { show('Error al quitar al integrante', 'error') }
    finally { setRemoveBusy(false) }
  }

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }} className="max-w-7xl">
      <style>{`
        @media (max-width: 640px) {
          .staff-table-wrap { overflow-x: visible !important; }
          .staff-table { min-width: 0 !important; width: 100% !important; }
          .staff-table thead { display: none; }
          .staff-table tbody tr {
            display: grid !important;
            grid-template-areas:
              "person person edit"
              "role   tools  tools";
            grid-template-columns: auto 1fr auto;
            padding: 12px 16px;
            gap: 6px 8px;
            border-bottom: 1px solid rgba(0,0,0,0.04);
          }
          .staff-table tbody tr:last-child { border-bottom: none; }
          .staff-table td { padding: 0 !important; }
          .staff-table td:nth-child(1) { grid-area: person; }
          .staff-table td:nth-child(2) { grid-area: role; align-self: center; }
          .staff-table td:nth-child(3) { grid-area: tools; align-self: center; }
          .staff-table td:nth-child(4) { grid-area: edit; align-self: start; justify-self: end; }
        }
      `}</style>
      <OrganizerToolHeading
        title="Equipo"
        description="Invitá integrantes por email. Reciben acceso al panel con el rol y herramientas que elijas."
        actions={
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#000000' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Invitar integrante
          </button>
        }
      />

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eventId={eventId}
        onInvited={load}
        onSuccess={msg => show(msg, 'success')}
        onError={msg => show(msg, 'error')}
      />

      {/* Controles de búsqueda y filtro */}
      {!loading && rows.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-black/[0.09] bg-white pr-8 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-black/25 transition-colors"
              style={{ paddingLeft: '34px' }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <ToolFilterDropdown value={toolFilter} onChange={setToolFilter} />
        </div>
      )}

      {/* Header de la lista */}
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="text-[13px] font-semibold text-gray-900">Integrantes</h3>
        {!loading && rows.length > 0 && (
          <span className="inline-flex items-center text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 tabular-nums">
            {hasFilters ? `${filtered.length} de ${rows.length}` : rows.length}
          </span>
        )}
      </div>

      {listErr && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {listErr}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 text-[13px] text-gray-400 py-8">
          <Spinner size="sm" /> Cargando…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.10] py-10 flex flex-col items-center text-center gap-1.5">
          <p className="text-[13px] font-medium text-gray-500">Sin resultados</p>
          <p className="text-[12px] text-gray-400">Ningún integrante coincide con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/[0.07] overflow-hidden">
          <div className="staff-table-wrap overflow-x-auto">
            <table className="staff-table w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-black/[0.05] text-left bg-[#FAFAFA]">
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">Integrante</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">Rol</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-400">Herramientas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map(row => (
                  <StaffRow key={row.id} row={row} onEdit={() => setEditingRow(row)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales a nivel raíz para evitar HTML inválido dentro de <tr> */}
      {editingRow && (
        <EditStaffModal
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
          eventId={eventId}
          row={editingRow}
          onUpdated={load}
          onError={msg => show(msg, 'error')}
          onSuccess={msg => show(msg, 'success')}
          onRemoveRequest={() => { setConfirmingRow(editingRow); setEditingRow(null) }}
        />
      )}
      {confirmingRow && (
        <ConfirmModal
          isOpen={!!confirmingRow}
          onClose={() => setConfirmingRow(null)}
          onConfirm={remove}
          title={`¿Quitar a ${confirmingRow.name}?`}
          message="Esta persona perderá el acceso al panel del evento de inmediato."
          confirmLabel="Sí, quitar"
          busy={removeBusy}
        />
      )}

      <ToastPortal />
    </div>
  )
}
