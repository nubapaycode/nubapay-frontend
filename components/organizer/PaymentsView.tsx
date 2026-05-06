'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'


import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspacePayments, type WorkspacePayment } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

const channelLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const channelClass: Record<string, string> = {
  mp: 'bg-sky-50 text-sky-700',
  cash: 'bg-green-50 text-green-700',
  transfer: 'bg-violet-50 text-violet-700',
}

const statusLabels: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  refunded: 'Reembolso',
}

const statusClass: Record<string, string> = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-800',
  rejected: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

const STATUS_TABS = [
  { key: 'approved', label: 'Aprobado' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'rejected', label: 'Rechazado' },
  { key: 'refunded', label: 'Reembolso' },
]

const CHANNELS = [
  { key: 'mp', label: 'Mercado Pago' },
  { key: 'cash', label: 'Efectivo' },
  { key: 'transfer', label: 'Transferencia' },
]

type AmountSort = 'none' | 'asc' | 'desc'
type DateSort = 'none' | 'asc' | 'desc'

const PAGE_SIZE = 20


function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  const d = new Date(s)
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    + ' '
    + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

const STATUS_OPTIONS = STATUS_TABS

function StatusDropdown({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (key: string) => {
    onChange(value.includes(key) ? value.filter(c => c !== key) : [...value, key])
  }

  const hasFilter = value.length > 0
  const label = hasFilter
    ? value.map(k => statusLabels[k] ?? k).join(', ')
    : 'Estado'

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '38px', padding: '0 14px',
          background: hasFilter ? '#C6FF00' : '#FAFAFA',
          border: `1px solid ${hasFilter ? '#C6FF00' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '12px', fontSize: '13px', fontWeight: hasFilter ? 600 : 400,
          color: hasFilter ? '#0A0A0F' : 'rgba(0,0,0,0.6)', cursor: 'pointer', whiteSpace: 'nowrap',
          maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        {hasFilter ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange([]) }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)', flexShrink: 0, cursor: 'pointer' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#fff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '6px', minWidth: '170px',
          animation: 'nb-select-pop 0.15s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {STATUS_OPTIONS.map(opt => {
            const active = value.includes(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', textAlign: 'left',
                  padding: '8px 12px', borderRadius: '9px', border: 'none',
                  background: active ? '#F5F5F7' : 'transparent',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? '#0A0A0F' : 'rgba(0,0,0,0.65)', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                  border: `1.5px solid ${active ? '#C6FF00' : 'rgba(0,0,0,0.18)'}`,
                  background: active ? '#C6FF00' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}>
                  {active && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChannelDropdown({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (key: string) => {
    onChange(value.includes(key) ? value.filter(c => c !== key) : [...value, key])
  }

  const hasFilter = value.length > 0
  const label = hasFilter
    ? value.map(k => CHANNELS.find(c => c.key === k)?.label ?? k).join(', ')
    : 'Canal'

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '38px', padding: '0 14px',
          background: hasFilter ? '#C6FF00' : '#FAFAFA',
          border: `1px solid ${hasFilter ? '#C6FF00' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '12px', fontSize: '13px', fontWeight: hasFilter ? 600 : 400,
          color: hasFilter ? '#0A0A0F' : 'rgba(0,0,0,0.6)', cursor: 'pointer', whiteSpace: 'nowrap',
          maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 4h11M3.5 7h7M5.5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        {hasFilter ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange([]) }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)', flexShrink: 0, cursor: 'pointer' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#fff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '6px', minWidth: '180px',
          animation: 'nb-select-pop 0.15s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {CHANNELS.map(ch => {
            const active = value.includes(ch.key)
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => toggle(ch.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', textAlign: 'left',
                  padding: '8px 12px', borderRadius: '9px', border: 'none',
                  background: active ? '#F5F5F7' : 'transparent',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? '#0A0A0F' : 'rgba(0,0,0,0.65)', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                  border: `1.5px solid ${active ? '#C6FF00' : 'rgba(0,0,0,0.18)'}`,
                  background: active ? '#C6FF00' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}>
                  {active && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {ch.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SimpleSortDropdown({
  value, onChange, label, icon, options,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  icon: React.ReactNode
  options: { key: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = value !== 'none'
  const current = options.find(o => o.key === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '38px', padding: '0 14px',
          background: active ? '#C6FF00' : '#FAFAFA',
          border: `1px solid ${active ? '#C6FF00' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '12px', fontSize: '13px', fontWeight: active ? 600 : 400,
          color: active ? '#0A0A0F' : 'rgba(0,0,0,0.6)', cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {icon}
        {active ? current?.label : label}
        {active ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange('none') }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)', flexShrink: 0, cursor: 'pointer' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4 }}>
            <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: '#fff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '6px', minWidth: '180px',
          animation: 'nb-select-pop 0.15s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: '9px', border: 'none',
                background: opt.key === value ? '#F5F5F7' : 'transparent',
                fontSize: '13px', fontWeight: opt.key === value ? 600 : 400,
                color: opt.key === value ? '#0A0A0F' : 'rgba(0,0,0,0.65)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PaymentsView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspacePayment[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [channelFilter, setChannelFilter] = useState<string[]>([])
  const [amountSort, setAmountSort] = useState<AmountSort>('none')
  const [dateSort, setDateSort] = useState<DateSort>('none')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await fetchWorkspacePayments(eventId, { page, pageSize: PAGE_SIZE })
    if (!res.ok) {
      setError(res.error)
      setRows([])
    } else {
      setRows(res.payments)
      setPagination(res.pagination)
    }
    setLoading(false)
  }, [eventId, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch helper owns loading/error; intentional on mount/page change
    void load()
  }, [load])

  const displayed = useMemo(() => {
    let base = [...rows]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      base = base.filter(r =>
        r.order_id.toLowerCase().includes(q)
        || r.order_id.slice(0, 8).toUpperCase().includes(q.toUpperCase())
      )
    }

    if (statusFilter.length > 0) {
      base = base.filter(r => statusFilter.includes(r.status))
    }

    if (channelFilter.length > 0) {
      base = base.filter(r => r.channel && channelFilter.includes(r.channel))
    }

    if (amountSort !== 'none') {
      base.sort((a, b) => amountSort === 'asc' ? a.amount - b.amount : b.amount - a.amount)
    } else if (dateSort !== 'none') {
      base.sort((a, b) => {
        const da = new Date(a.paid_at ?? a.created_at ?? 0).getTime()
        const db = new Date(b.paid_at ?? b.created_at ?? 0).getTime()
        return dateSort === 'asc' ? da - db : db - da
      })
    }

    return base
  }, [rows, search, statusFilter, channelFilter, amountSort, dateSort])

  if (loading) {
    return (
      <div className="max-w-6xl flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando pagos…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl" style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <OrganizerToolHeading
        title="Pagos"
        description="Registros de cobro asociados a pedidos del evento."
      />

      {/* Filters bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#C8C8D0', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID de pedido…"
            style={{
              width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '12px',
              borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
              background: '#FAFAFA', fontSize: '13px', color: '#0A0A0F',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status dropdown */}
        <StatusDropdown value={statusFilter} onChange={setStatusFilter} />

        {/* Channel dropdown */}
        <ChannelDropdown value={channelFilter} onChange={setChannelFilter} />

        {/* Sort monto */}
        <SimpleSortDropdown
          value={amountSort}
          onChange={v => { setAmountSort(v as AmountSort); if (v !== 'none') setDateSort('none') }}
          label="Monto"
          icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M7 2v10M4 9l3 3 3-3M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          options={[
            { key: 'asc', label: 'Menor a mayor' },
            { key: 'desc', label: 'Mayor a menor' },
          ]}
        />

        {/* Sort fecha */}
        <SimpleSortDropdown
          value={dateSort}
          onChange={v => { setDateSort(v as DateSort); if (v !== 'none') setAmountSort('none') }}
          label="Fecha"
          icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 6h10M5 2v2M9 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
          options={[
            { key: 'desc', label: 'Más reciente' },
            { key: 'asc', label: 'Más antigua' },
          ]}
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <div style={{ padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="14" rx="2.5" stroke="#C8C8D0" strokeWidth="1.6"/>
                <path d="M2 9h18" stroke="#C8C8D0" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M6 5V3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V5" stroke="#C8C8D0" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M7 14h4M7 17h2" stroke="#C8C8D0" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 4px 0' }}>Sin pagos registrados</p>
              <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Los cobros del evento aparecerán acá una vez que se procesen.</p>
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: 0 }}>Sin resultados</p>
            <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Probá con otros filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(row => {
                  const st = row.status
                  const stCls = statusClass[st] ?? 'bg-gray-100 text-gray-600'
                  const ch = row.channel ?? ''
                  const chCls = channelClass[ch] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={row.id} className="text-gray-900 hover:bg-gray-50/80">
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stCls}`}>
                          {statusLabels[st] ?? st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.provider ?? '—'}</td>
                      <td className="px-4 py-3 align-middle">
                        {ch ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${chCls}`}>
                            {channelLabels[ch] ?? ch}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 tracking-wide">
                        #{row.order_id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {formatPrice(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {fmtDate(row.paid_at || row.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.total > 0 && (
        <div className="mt-4">
          <PaginationBar
            page={pagination.page}
            pageSize={pagination.page_size}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
