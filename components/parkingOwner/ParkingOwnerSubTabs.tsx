'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

/** Pestañas entre las pantallas de una misma sección del panel (ej. Productos / Bloques). */
export function ParkingOwnerSubTabs({ tabs, label }: { tabs: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="mb-6 inline-flex gap-1 rounded-xl bg-[#F5F5F7] p-1">
      {tabs.map(t => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
