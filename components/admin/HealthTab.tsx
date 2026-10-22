'use client'

import { AlertTriangle, CheckCircle2, Database, RefreshCw, Server, ShieldAlert, Wallet, XCircle } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { ageLabel, fmtDateTime, fmtInt, timeAgo } from './format'
import { Btn, Card, EmptyState, ErrorNote, Pill, Skeleton, Table, Td, Th, cx, useAsync } from './ui'
import { fetchAdminActivity, fetchPlatformHealth, type PlatformHealth } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

const REFRESH_MS = 30_000

const WORKER_STATE_LABEL: Record<string, string> = { idle: 'libre', busy: 'procesando', started: 'iniciando' }

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-medium', ok ? 'text-emerald-300' : 'text-red-300')}>
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  )
}

function InfraCard({ icon, title, status, children }: { icon: ReactNode; title: string; status: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-white/85">
          <span className="text-white/40">{icon}</span>
          {title}
        </span>
        {status}
      </div>
      <div className="mt-3 text-xs text-white/50">{children}</div>
    </div>
  )
}

function Banner({ health }: { health: PlatformHealth }) {
  if (health.alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4">
        <CheckCircle2 className="text-emerald-300" size={20} />
        <div>
          <p className="text-sm font-semibold text-emerald-200">Todo en orden</p>
          <p className="text-xs text-emerald-200/60">Redis, base de datos, workers y pagos funcionan con normalidad.</p>
        </div>
      </div>
    )
  }
  const critical = health.alerts.some((a) => a.level === 'critical')
  return (
    <div
      className={cx(
        'rounded-2xl border px-5 py-4',
        critical ? 'border-red-400/25 bg-red-400/[0.07]' : 'border-amber-400/25 bg-amber-400/[0.06]',
      )}
    >
      <p className={cx('flex items-center gap-2 text-sm font-semibold', critical ? 'text-red-200' : 'text-amber-200')}>
        {critical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
        {health.alerts.length === 1 ? '1 alerta activa' : `${health.alerts.length} alertas activas`}
      </p>
      <ul className="mt-2 space-y-1">
        {health.alerts.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/75">
            {a.level === 'critical' ? (
              <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-300" />
            ) : (
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-300" />
            )}
            {a.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HealthTab({ onOpenOrder }: { onOpenOrder: (orderId: string) => void }) {
  const { data: health, error, loading, reload } = useAsync(fetchPlatformHealth, [])
  const activity = useAsync(fetchAdminActivity, [])
  const liveWorkers = (health?.workers ?? []).filter((w) => w.alive)

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, REFRESH_MS)
    return () => clearInterval(t)
  }, [reload])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/40">
          {health ? `Última revisión ${fmtDateTime(health.checked_at)} · se actualiza solo cada 30 s` : 'Revisando…'}
        </p>
        <Btn
          size="sm"
          onClick={() => {
            reload()
            activity.reload()
          }}
          disabled={loading}
        >
          <RefreshCw size={13} className={cx(loading && 'animate-spin')} />
          Revisar ahora
        </Btn>
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      {!health && loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      ) : health ? (
        <div className={cx('space-y-6 transition-opacity', loading && 'opacity-70')}>
          <Banner health={health} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfraCard
              icon={<Database size={16} />}
              title="Base de datos"
              status={<StatusDot ok={health.db.ok} label={health.db.ok ? 'Operativa' : 'Caída'} />}
            >
              Latencia <span className="font-medium tabular-nums text-white/80">{health.db.latency_ms} ms</span>
            </InfraCard>

            <InfraCard
              icon={<Server size={16} />}
              title="Redis"
              status={<StatusDot ok={health.redis.ok} label={health.redis.ok ? 'Operativo' : 'Sin conexión'} />}
            >
              {health.redis.ok ? (
                <>
                  Latencia <span className="font-medium tabular-nums text-white/80">{health.redis.latency_ms} ms</span>
                </>
              ) : (
                <span className="break-words text-red-300/80">{health.redis.error}</span>
              )}
            </InfraCard>

            <InfraCard
              icon={<Server size={16} />}
              title="Workers"
              status={<StatusDot ok={liveWorkers.length > 0} label={`${liveWorkers.length} activo${liveWorkers.length === 1 ? '' : 's'}`} />}
            >
              {health.workers.length === 0 ? (
                'Ningún worker conectado a Redis.'
              ) : (
                <ul className="space-y-0.5">
                  {health.workers.slice(0, 3).map((w) => (
                    <li key={w.name} className="flex justify-between gap-2">
                      <span className="truncate font-mono text-[11px]">{w.name.slice(0, 14)}</span>
                      <span className={cx('flex-shrink-0', w.alive ? 'text-white/70' : 'text-amber-300')}>
                        {w.alive ? WORKER_STATE_LABEL[w.state] ?? w.state : 'sin estado'}
                      </span>
                    </li>
                  ))}
                  {health.workers.length > 3 && <li>+{health.workers.length - 3} más</li>}
                </ul>
              )}
            </InfraCard>

            <InfraCard
              icon={<Wallet size={16} />}
              title="Pagos"
              status={
                <StatusDot
                  ok={health.payments.saved && health.payments.effective}
                  label={!health.payments.saved ? 'Inhabilitados' : health.payments.effective ? 'Habilitados' : 'Desfasado'}
                />
              }
            >
              Guardado: <b className="text-white/80">{health.payments.saved ? 'sí' : 'no'}</b> · Efectivo:{' '}
              <b className="text-white/80">{health.payments.effective ? 'sí' : 'no'}</b>
              <br />
              Último cambio {timeAgo(health.payments.updated_at)}
              {health.payments.updated_by ? ` por ${health.payments.updated_by}` : ''}
            </InfraCard>
          </div>

          <Card title="Colas de órdenes" subtitle="Trabajo pendiente en Redis / RQ" flush>
            <Table min={480}>
              <thead className="border-b border-white/[0.06]">
                <tr>
                  <Th>Cola</Th>
                  <Th align="right">En espera</Th>
                  <Th align="right">Procesando</Th>
                  <Th align="right">Fallidos</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {health.queues.map((q) => (
                  <tr key={q.name}>
                    <Td>{q.name}</Td>
                    <Td align="right">{fmtInt(q.queued)}</Td>
                    <Td align="right">{fmtInt(q.started)}</Td>
                    <Td align="right" className={q.failed ? '!text-red-300' : undefined}>
                      {fmtInt(q.failed)}
                    </Td>
                  </tr>
                ))}
                {health.queues.length === 0 && (
                  <tr>
                    <Td muted>Sin información de colas (Redis no disponible).</Td>
                    <Td />
                    <Td />
                    <Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>

          <Card
            title="Órdenes que necesitan atención"
            subtitle={`Pagos aprobados sin confirmar, órdenes trabadas o fallidas. ${fmtInt(health.abandoned_carts)} carritos sin pagar (>2 h, últimos 7 días) no se listan.`}
            flush
          >
            {health.problems.length === 0 ? (
              <EmptyState title="No hay órdenes problemáticas" hint="Los pagos aprobados y las colas están al día." />
            ) : (
              <Table min={760}>
                <thead className="border-b border-white/[0.06]">
                  <tr>
                    <Th>Problema</Th>
                    <Th>#</Th>
                    <Th>Evento</Th>
                    <Th>Cliente</Th>
                    <Th align="right">Antigüedad</Th>
                    <Th align="right">Total</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {health.problems.map((p) => (
                    <tr key={p.id + p.reason} className="hover:bg-white/[0.02]">
                      <Td>
                        <Pill tone={p.reason.startsWith('Pago aprobado') ? 'critical' : 'warning'}>{p.reason}</Pill>
                      </Td>
                      <Td>{p.order_number ?? '—'}</Td>
                      <Td className="max-w-[180px] truncate">{p.event_name ?? '—'}</Td>
                      <Td className="max-w-[200px] truncate">{p.customer_email ?? p.customer_name ?? '—'}</Td>
                      <Td align="right" muted>
                        {ageLabel(p.age_minutes)}
                      </Td>
                      <Td align="right">{formatPrice(p.total_amount, p.currency)}</Td>
                      <Td align="right">
                        <Btn size="sm" onClick={() => onOpenOrder(p.id)}>
                          Revisar
                        </Btn>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      ) : null}

      <Card title="Actividad manual reciente" subtitle="Cambios de estado hechos por personas (admin y organizadores)" flush>
        {activity.error ? (
          <div className="px-5 pb-5">
            <ErrorNote message={activity.error} onRetry={activity.reload} />
          </div>
        ) : !activity.data && activity.loading ? (
          <div className="px-5 pb-5">
            <Skeleton className="h-24" />
          </div>
        ) : (activity.data?.activity.length ?? 0) === 0 ? (
          <EmptyState title="Todavía no hay cambios manuales" />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {activity.data!.activity.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/85">
                    <button type="button" onClick={() => onOpenOrder(a.order_id)} className="font-medium text-[#C6FF00] hover:underline">
                      Orden #{a.order_number ?? '—'}
                    </button>{' '}
                    <span className="text-white/45">· {a.event_name}</span>
                  </p>
                  <p className="mt-0.5 break-words text-xs text-white/50">
                    {a.note ? a.note.replace('[admin] ', '') : `${a.from_status ?? '—'} → ${a.to_status}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right text-xs text-white/40">
                  <p>{a.by}</p>
                  <p>{timeAgo(a.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
