'use client'

import { useCallback, useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'
import { deleteEventStaff, fetchEventStaffList, inviteEventStaff, patchEventStaff, resendEventStaffInviteEmail, type EventStaffRow } from '@/lib/organizerStaff'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#0A0A0F',
  background: '#FAFAFA',
  outline: 'none',
  boxSizing: 'border-box',
}

const TOOL_OPTS: { key: keyof OrganizerStaffTools; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard / métricas' },
  { key: 'storefront', label: 'Escaparate del evento' },
  { key: 'products', label: 'Catálogo y promos' },
  { key: 'scanner', label: 'Escáner QR' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'pickup_points', label: 'Puntos de retiro' },
  { key: 'payments', label: 'Pagos' },
]

function defaultTools(): OrganizerStaffTools {
  return { ...ORGANIZER_ZERO_TOOLS, orders: true, scanner: true }
}

export function StaffView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<EventStaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [tools, setTools] = useState<OrganizerStaffTools>(defaultTools)
  const [formErr, setFormErr] = useState('')
  const [inviteNotice, setInviteNotice] = useState('')
  const [staffNotice, setStaffNotice] = useState('')

  const load = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const res = await fetchEventStaffList(eventId)
      if (!res.ok) {
        setErr(res.error)
        return
      }
      setRows(res.staff)
    } catch {
      setErr('Error de red')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const toggleTool = (k: keyof OrganizerStaffTools) => {
    setTools(t => ({ ...t, [k]: !t[k] }))
  }

  const invite = async () => {
    setFormErr('')
    setInviteNotice('')
    setStaffNotice('')
    if (name.trim().length < 2) {
      setFormErr('Nombre obligatorio (mín. 2 caracteres)')
      return
    }
    if (!email.includes('@')) {
      setFormErr('Email inválido')
      return
    }
    if (!Object.values(tools).some(Boolean)) {
      setFormErr('Elegí al menos una herramienta')
      return
    }
    setSaving(true)
    try {
      const res = await inviteEventStaff(eventId, {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: role.trim() || 'Integrante',
        tools,
      })
      if (!res.ok) {
        setFormErr(res.detail ? `${res.error}: ${res.detail}` : res.error)
        return
      }
      if (!res.email_sent) {
        setInviteNotice(
          'Integrante agregado, pero no se envió el email (revisá consola del servidor o la API de correo). Si era cuenta nueva, la contraseña temporal se imprimió en el log del backend.',
        )
      }
      setEmail('')
      setName('')
      setRole('')
      setTools(defaultTools())
      await load()
    } catch {
      setFormErr('No se pudo enviar la invitación')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: EventStaffRow) => {
    if (!window.confirm(`¿Quitar a ${row.name} del equipo?`)) return
    setErr('')
    const res = await deleteEventStaff(eventId, row.id)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    await load()
  }

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }} className="max-w-2xl">
      <OrganizerToolHeading
        title="Equipo"
        description="Invitá integrantes por email. Reciben acceso al panel con el rol y herramientas que elijas (contraseña temporal por correo si son nuevos en Nubapay)."
      />

      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}
      {staffNotice && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {staffNotice}
        </div>
      )}

      <div className="rounded-2xl border border-black/10 bg-white p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Invitar integrante</h3>
        <div className="flex flex-col gap-3">
          <input type="email" placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} disabled={saving} autoComplete="off" />
          <input type="text" placeholder="Nombre *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} disabled={saving} />
          <input type="text" placeholder="Rol (ej. Caja, Producción)" value={role} onChange={e => setRole(e.target.value)} style={inputStyle} disabled={saving} />
          <div className="mt-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Herramientas</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOOL_OPTS.map(({ key, label }) => (
                <li key={key}>
                  <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                    <input type="checkbox" checked={tools[key]} onChange={() => toggleTool(key)} disabled={saving} className="rounded border-gray-300" />
                    {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {formErr && (
            <p className="text-sm text-red-600">{formErr}</p>
          )}
          {inviteNotice && (
            <p className="text-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              {inviteNotice}
            </p>
          )}
          <button
            type="button"
            onClick={invite}
            disabled={saving}
            className="mt-2 rounded-full bg-[#0A0A0F] text-white text-sm font-semibold py-3 disabled:opacity-50"
          >
            {saving ? 'Invitando…' : 'Enviar invitación'}
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-3">Integrantes</h3>
      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay integrantes invitados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(row => (
            <li key={row.id} className="rounded-xl border border-black/8 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{row.name}</p>
                <p className="text-xs text-gray-500 truncate">{row.email}</p>
                <p className="text-xs text-gray-600 mt-1">Rol: {row.role}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {TOOL_OPTS.filter(o => row.tools[o.key]).map(o => o.label).join(' · ') || 'Sin herramientas'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-start shrink-0">
                <ResendEmailButton
                  eventId={eventId}
                  staffRowId={row.id}
                  onNotice={msg => {
                    setErr('')
                    setStaffNotice(msg)
                  }}
                  onError={msg => {
                    setStaffNotice('')
                    setErr(msg)
                  }}
                />
                <StaffRowActions eventId={eventId} row={row} onUpdated={load} onError={setErr} />
              </div>
              <button
                type="button"
                onClick={() => remove(row)}
                className="text-xs font-medium text-red-600 hover:text-red-800 shrink-0 self-start sm:self-center"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ResendEmailButton({
  eventId,
  staffRowId,
  onNotice,
  onError,
}: {
  eventId: string
  staffRowId: string
  onNotice: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (
          !window.confirm(
            '¿Reenviar el correo de acceso? Si es una cuenta solo de equipo (invitada), se generará una nueva contraseña temporal y la anterior dejará de valer.',
          )
        ) {
          return
        }
        setBusy(true)
        onError('')
        try {
          const res = await resendEventStaffInviteEmail(eventId, staffRowId)
          if (!res.ok) {
            onError(res.detail ? `${res.error}: ${res.detail}` : res.error)
            return
          }
          if (!res.email_sent) {
            onNotice(
              'Actualizamos la cuenta si correspondía, pero el email no se envió. Revisá el log del backend para la contraseña temporal.',
            )
          } else {
            onNotice('Te enviamos de nuevo el correo de acceso.')
          }
        } catch {
          onError('No se pudo reenviar el email')
        } finally {
          setBusy(false)
        }
      }}
      className="text-xs font-medium text-[#0A0A0F] border border-black/15 rounded-full px-3 py-1.5 hover:bg-black/5 disabled:opacity-50 shrink-0"
    >
      {busy ? 'Enviando…' : 'Reenviar email'}
    </button>
  )
}

function StaffRowActions({
  eventId,
  row,
  onUpdated,
  onError,
}: {
  eventId: string
  row: EventStaffRow
  onUpdated: () => void
  onError: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tools, setTools] = useState<OrganizerStaffTools>(row.tools)
  const [role, setRole] = useState(row.role)
  const [busy, setBusy] = useState(false)

  const toggle = (k: keyof OrganizerStaffTools) => {
    setTools(t => ({ ...t, [k]: !t[k] }))
  }

  const save = async () => {
    if (!Object.values(tools).some(Boolean)) {
      onError('Al menos una herramienta debe estar activa')
      return
    }
    setBusy(true)
    onError('')
    try {
      const res = await patchEventStaff(eventId, row.id, { role, tools })
      if (!res.ok) {
        onError(res.error)
        return
      }
      setOpen(false)
      onUpdated()
    } catch {
      onError('Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-gray-600 hover:text-gray-900 shrink-0">
        Editar permisos
      </button>
    )
  }

  return (
    <div className="shrink-0 border border-gray-200 rounded-lg p-3 bg-gray-50 min-w-[200px]">
      <input value={role} onChange={e => setRole(e.target.value)} className="w-full text-xs border rounded px-2 py-1 mb-2" placeholder="Rol" />
      <ul className="space-y-1 max-h-40 overflow-y-auto mb-2">
        {TOOL_OPTS.map(({ key, label }) => (
          <li key={key}>
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
              <input type="checkbox" checked={tools[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="text-[11px] font-semibold text-white bg-gray-900 rounded px-2 py-1 disabled:opacity-50">
          Guardar
        </button>
        <button type="button" onClick={() => { setOpen(false); setTools(row.tools); setRole(row.role) }} className="text-[11px] text-gray-600">
          Cancelar
        </button>
      </div>
    </div>
  )
}
