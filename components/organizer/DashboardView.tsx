'use client'

import { useDashboard } from '@/lib/hooks/useDashboard'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STATUS_LABELS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'preparing', label: 'En preparación' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
]

export function DashboardView() {
  const { orders } = useDashboard()

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  const topProducts = Object.values(
    orders.flatMap(o => o.items).reduce<Record<string, { name: string; quantity: number }>>(
      (acc, item) => {
        if (acc[item.name]) {
          acc[item.name].quantity += item.quantity
        } else {
          acc[item.name] = { name: item.name, quantity: item.quantity }
        }
        return acc
      },
      {}
    )
  )
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        {STATUS_LABELS.map(({ key, label }) => {
          const count = orders.filter(o => o.status === key).length
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total recaudado</p>
          <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total pedidos</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Top productos</h2>
        <div className="flex flex-col gap-2">
          {topProducts.map(product => (
            <div key={product.name} className="flex justify-between text-sm">
              <span className="text-gray-800">{product.name}</span>
              <span className="font-medium text-gray-500">{product.quantity} uds.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
