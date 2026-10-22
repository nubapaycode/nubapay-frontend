'use client'

import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

import { fmtDateTime } from './format'
import { Card, EmptyState, ErrorNote, Pager, Pill, Skeleton, Table, Td, Th, cx, inputCls, useAsync, useDebounced, usePageForKey } from './ui'
import { fetchPlatformUsersFiltered } from '@/lib/platformAdmin'

const PAGE_SIZE = 25

export function UsersTab({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? '')
  const dq = useDebounced(q, 300)
  const [page, setPage] = usePageForKey(dq)

  const load = useCallback(() => fetchPlatformUsersFiltered(page, PAGE_SIZE, dq.trim()), [page, dq])
  const { data, error, loading, reload } = useAsync(load, [load])
  const users = data?.users ?? []

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
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
            <Table min={680}>
              <thead className="border-b border-white/[0.06]">
                <tr>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th>Tenant</Th>
                  <Th>Onboarding</Th>
                  <Th>Alta</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <Td className="font-medium text-white">{u.name}</Td>
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
                      <Pill tone={u.onboarding_completed ? 'good' : 'neutral'}>{u.onboarding_completed ? 'Completo' : 'Pendiente'}</Pill>
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
