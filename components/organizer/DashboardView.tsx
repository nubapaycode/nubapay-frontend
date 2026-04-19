'use client'

import { useDashboard } from '@/lib/hooks/useDashboard'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const PAYMENT_CONFIG = [
  { key: 'mp', label: 'Mercado Pago', dot: 'bg-blue-400' },
  { key: 'cash', label: 'Efectivo', dot: 'bg-green-400' },
  { key: 'transfer', label: 'Transferencia', dot: 'bg-purple-400' },
] as const

const STATUS_CONFIG: { key: OrderStatus; label: string; dot: string }[] = [
  { key: 'pending', label: 'Pendientes', dot: 'bg-amber-400' },
  { key: 'preparing', label: 'En preparación', dot: 'bg-blue-400' },
  { key: 'ready', label: 'Listos', dot: 'bg-green-400' },
  { key: 'delivered', label: 'Entregados', dot: 'bg-gray-300' },
]

function LineChart({ data }: { data: { hour: string; revenue: number }[] }) {
  const W = 400
  const H = 150
  const pad = { left: 4, right: 4, top: 8, bottom: 4 }
  const maxVal = Math.max(...data.map(d => d.revenue), 1)

  const pts = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * (W - pad.left - pad.right)
    const y = pad.top + (1 - d.revenue / maxVal) * (H - pad.top - pad.bottom)
    return { x, y, ...d }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111827" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#111827" />
      ))}
    </svg>
  )
}

export function DashboardView() {
  const { orders } = useDashboard()

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const activeOrders = orders.filter(o => o.status !== 'delivered').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  // Ventas por hora — últimas 8 horas
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const h = new Date()
    h.setHours(h.getHours() - (7 - i), 0, 0, 0)
    const label = h.getHours().toString().padStart(2, '0') + 'h'
    const revenue = orders
      .filter(o => {
        const d = new Date(o.createdAt)
        return d.getHours() === h.getHours()
      })
      .reduce((s, o) => s + o.total, 0)
    return { hour: label, revenue }
  })

  const topProducts = Object.values(
    orders.flatMap(o => o.items).reduce<Record<string, { name: string; quantity: number; revenue: number }>>(
      (acc, item) => {
        if (acc[item.name]) {
          acc[item.name].quantity += item.quantity
          acc[item.name].revenue += item.price * item.quantity
        } else {
          acc[item.name] = { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity }
        }
        return acc
      },
      {}
    )
  ).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  const maxQty = topProducts[0]?.quantity ?? 1

  return (
    <div className="max-w-6xl space-y-4">

      {/* Header */}
      <div className="mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Recaudado</p>
          <p className="text-lg font-medium text-gray-900">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pedidos</p>
          <p className="text-lg font-medium text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Activos</p>
          <p className="text-lg font-medium text-gray-900">{activeOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Entregados</p>
          <p className="text-lg font-medium text-gray-900">{deliveredOrders}</p>
        </div>
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Columna izquierda: estado + gráfico por hora */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Por estado */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Por estado</p>
            <div className="flex flex-col gap-3">
              {STATUS_CONFIG.map(({ key, label, dot }) => {
                const count = orders.filter(o => o.status === key).length
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                        <span className="text-xs text-gray-300 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-4">
                      <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ventas por hora */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ventas por hora</p>
              <span className="text-xs text-gray-400">últimas 8h</span>
            </div>
            <LineChart data={hourlyData} />
            <div className="flex justify-between mt-2">
              {hourlyData.map(d => (
                <span key={d.hour} className="text-[10px] text-gray-300">{d.hour}</span>
              ))}
            </div>
          </div>

        </div>

        {/* Columna derecha: pagos + top productos */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Métodos de pago */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Métodos de pago</p>
            <div className="flex flex-col gap-3">
              {PAYMENT_CONFIG.map(({ key, label, dot }) => {
                const count = orders.filter(o => o.paymentMethod === key).length
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0
                const revenue = orders.filter(o => o.paymentMethod === key).reduce((s, o) => s + o.total, 0)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{count} pedidos</span>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">{formatPrice(revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-4">
                      <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top productos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Más vendidos</p>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-6 3 3 7-9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-900">Sin ventas aún</p>
                <p className="text-xs text-gray-400 mt-1">Los más vendidos aparecerán acá</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {topProducts.map((product, i) => (
                  <div key={product.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-gray-300 font-medium w-3 shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400">{product.quantity} uds.</span>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">{formatPrice(product.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-5">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(product.quantity / maxQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
