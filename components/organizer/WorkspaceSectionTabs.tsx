'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'

import { useWorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import type { WorkspaceSectionKey } from '@/lib/organizerWorkspaceSections'
import { visibleSectionTabs } from '@/lib/organizerWorkspaceSections'

const PILL_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

/**
 * Pestañas de navegación entre herramientas de una misma sección (ej. Pagos / Métodos de pago / Comisión).
 * Vive en el layout del route group para que la pastilla se deslice entre páginas.
 * No se muestra en subrutas (ej. `metodos-pago/mercadopago`) ni si hay menos de 2 pestañas permitidas.
 */
export function WorkspaceSectionTabs({ section, label }: { section: WorkspaceSectionKey; label: string }) {
  const access = useWorkspaceAccess()
  const pathname = usePathname()
  const tabs = access ? visibleSectionTabs(section, access) : []
  const activeIndex = access ? tabs.findIndex(t => pathname === `${access.basePath}/${t.segment}`) : -1

  const listRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false, animate: false })

  useLayoutEffect(() => {
    const measure = () =>
      queueMicrotask(() => {
        const el = linkRefs.current[activeIndex]
        if (!el) return
        setPill(p => ({ left: el.offsetLeft, width: el.offsetWidth, ready: true, animate: p.ready }))
      })
    measure()
    if (typeof ResizeObserver === 'undefined' || !listRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [activeIndex, tabs.length])

  if (!access || tabs.length < 2 || activeIndex === -1) return null

  return (
    <div className="relative z-10 px-4 pt-6 -mb-2 md:pl-[35px] md:pr-8 md:pt-10 md:-mb-6">
      <nav aria-label={label} className="max-w-full overflow-x-auto">
        <div
          ref={listRef}
          className="relative inline-flex gap-1 rounded-xl p-1"
          style={{ background: '#F5F5F7' }}
        >
          {/* Pastilla deslizante */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: 0,
              width: pill.width,
              transform: `translateX(${pill.left}px)`,
              background: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              opacity: pill.ready ? 1 : 0,
              transition: pill.animate ? `transform 0.28s ${PILL_EASING}, width 0.28s ${PILL_EASING}` : 'none',
              pointerEvents: 'none',
            }}
          />
          {tabs.map((tab, i) => {
            const active = i === activeIndex
            return (
              <Link
                key={tab.segment}
                ref={el => { linkRefs.current[i] = el }}
                href={`${access.basePath}/${tab.segment}`}
                aria-current={active ? 'page' : undefined}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  color: active ? '#0A0A0F' : '#9A9AA8',
                  transition: 'color 0.2s ease',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
