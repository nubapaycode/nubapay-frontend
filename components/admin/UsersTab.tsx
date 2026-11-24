'use client'

import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

import { fmtDateTime } from './format'
import { Card, EmptyState, ErrorNote, Pager, Pill, Skeleton, Table, Td, Th, Toggle, cx, inputCls, useAsync, useDebounced, usePageForKey, useToast } from './ui'
import { ALL_MODULES, DEFAULT_MODULES, type ModuleKey } from '@/lib/modules'
import { fetchPlatformUsersFiltered, setUserModules, setUserWhatsApp } from '@/lib/platformAdmin'

const PAGE_SIZE = 25

export function UsersTab({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? '')
  const dq = useDebounced(q, 300)
  const [page, setPage] = usePageForKey(dq)

  const load = useCallback(() => fetchPlatformUsersFiltered(page, PAGE_SIZE, dq.trim()), [page, dq])
  const { data, error, loading, reload } = useAsync(load, [load])
  const users = data?.users ?? []
  const toast = useToast()

  // Cambios en curso o ya guardados, por usuario: se ven al instante sin recargar la lista.
  const [overrides, setOverrides] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const modulesOf = (u: { id: string; modules?: string[] }): string[] => overrides[u.id] ?? u.modules ?? DEFAULT_MODULES

  async function toggleModule(u: { id: string; name: string; modules?: string[] }, key: ModuleKey, on: boolean) {
    if (saving[u.id]) return
    const current = modulesOf(u)
    const next = ALL_MODULES.map(m => m.key).filter(k => (k === key ? on : current.includes(k)))
    setOverrides(o => ({ ...o, [u.id]: next }))
    setSaving(s => ({ ...s, [u.id]: true }))
    const r = await setUserModules(u.id, next)
    setSaving(s => ({ ...s, [u.id]: false }))
    if (r.ok) {
      setOverrides(o => ({ ...o, [u.id]: r.data.modules }))
      toast('success', `Herramientas de ${u.name} actualizadas (puede demorar hasta 30 s en la tienda pública)`)
    } else {
      setOverrides(o => ({ ...o, [u.id]: current }))
      toast('error', r.error)
    }
  }

  // WhatsApp: interruptor y número del organizador. `waDraft` es lo que se está escribiendo en el campo.
  const [waOverrides, setWaOverrides] = useState<Record<string, { enabled: boolean; phone: string | null }>>({})
  const [waDraft, setWaDraft] = useState<Record<string, string>>({})
  const [waSaving, setWaSaving] = useState<Record<string, boolean>>({})
  const whatsappOf = (u: { id: string; whatsapp_enabled?: boolean; whatsapp_phone?: string | null }) =>
    waOverrides[u.id] ?? { enabled: Boolean(u.whatsapp_enabled), phone: u.whatsapp_phone ?? null }
  const phoneLabel = (phone: string | null) => (phone ? `+${phone}` : '')

  async function saveWhatsApp(
    u: { id: string; name: string; whatsapp_enabled?: boolean; whatsapp_phone?: string | null },
    change: { enabled?: boolean; phone?: string | null },
  ) {
    if (waSaving[u.id]) return
    const current = whatsappOf(u)
    setWaSaving(s => ({ ...s, [u.id]: true }))
    if (change.enabled !== undefined) setWaOverrides(o => ({ ...o, [u.id]: { ...current, enabled: change.enabled as boolean } }))
    const r = await setUserWhatsApp(u.id, change)
    setWaSaving(s => ({ ...s, [u.id]: false }))
    if (r.ok) {
      setWaOverrides(o => ({ ...o, [u.id]: { enabled: r.data.whatsapp_enabled, phone: r.data.whatsapp_phone } }))
      setWaDraft(d => {
        const next = { ...d }
        delete next[u.id]
        return next
      })
      toast('success', `WhatsApp de ${u.name} actualizado`)
    } else {
      setWaOverrides(o => ({ ...o, [u.id]: current }))
      toast('error', r.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
        <input aria-label="Buscar usuarios" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o email…" className={cx(inputCls, 'pl-9')} />
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      <Card flush>
        {!data && loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="Sin usuarios" />
        ) : (
          <div className={cx('transition-opacity', loading && 'opacity-60')}>
            <Table min={1100}>
              <thead className="border-b border-white/[0.06]">
                <tr>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th>Tenant</Th>
                  <Th>Herramientas</Th>
                  <Th>Onboarding</Th>
                  <Th>WhatsApp</Th>
                  <Th>Alta</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <Td className="font-semibold text-white">{u.name}</Td>
                    <Td>{u.email}</Td>
                    <Td>
                      {u.role}
                      {u.partner && (
                        <span className="ml-2">
                          <Pill tone="info">Partner</Pill>
                        </span>
                      )}
                    </Td>
                    <Td muted>{u.tenant_subdomain ?? '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {ALL_MODULES.map(m => (
                          <label key={m.key} className="flex items-center gap-2 text-[12px] text-white/70" title={m.description}>
                            <Toggle
                              checked={modulesOf(u).includes(m.key)}
                              disabled={saving[u.id]}
                              label={`${m.label} para ${u.name}`}
                              onChange={on => void toggleModule(u, m.key, on)}
                            />
                            <span aria-hidden>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <Pill tone={u.onboarding_completed ? 'good' : 'neutral'}>{u.onboarding_completed ? 'Completo' : 'Pendiente'}</Pill>
                    </Td>
                    <Td>
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <label className="flex items-center gap-2 text-[12px] text-white/70">
                          <Toggle
                            checked={whatsappOf(u).enabled}
                            disabled={waSaving[u.id]}
                            label={`WhatsApp para ${u.name}`}
                            onChange={on => void saveWhatsApp(u, { enabled: on })}
                          />
                          <span aria-hidden>{whatsappOf(u).enabled ? 'Activo' : 'Apagado'}</span>
                        </label>
                        <input
                          aria-label={`WhatsApp del organizador ${u.name}`}
                          className={cx(inputCls, 'py-1.5 text-[12px]')}
                          placeholder="+54 9 11 5555-1234"
                          inputMode="tel"
                          disabled={waSaving[u.id]}
                          value={waDraft[u.id] ?? phoneLabel(whatsappOf(u).phone)}
                          onChange={e => setWaDraft(d => ({ ...d, [u.id]: e.target.value }))}
                          onBlur={() => {
                            const draft = waDraft[u.id]
                            if (draft !== undefined && draft.trim() !== phoneLabel(whatsappOf(u).phone)) {
                              void saveWhatsApp(u, { phone: draft.trim() })
                            } else if (draft !== undefined) {
                              setWaDraft(d => {
                                const next = { ...d }
                                delete next[u.id]
                                return next
                              })
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                          }}
                        />
                      </div>
                    </Td>
                    <Td muted className="whitespace-nowrap">
                      {fmtDateTime(u.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data?.pagination && <Pager page={page} total={data.pagination.total} pageSize={PAGE_SIZE} onPage={setPage} />}
          </div>
        )}
      </Card>
    </div>
  )
}
