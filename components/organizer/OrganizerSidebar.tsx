'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const NAV_ITEMS = [
  {
    href: '/dashboard', label: 'Dashboard', mobileOnly: false,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/></svg>,
  },
  {
    href: '/orders', label: 'Pedidos', mobileOnly: false,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 8h12M2 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    href: '/products', label: 'Productos', mobileOnly: false,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    href: '/events', label: 'Eventos', mobileOnly: false,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    href: '/scanner', label: 'Scanner', mobileOnly: true,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10h2v2h-2zM13 10h2M13 13h2v2M10 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
]

const desktopItems = NAV_ITEMS.filter(item => !item.mobileOnly)

export function OrganizerSidebar() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pill, setPill] = useState<{ top: number; height: number; ready: boolean }>({ top: 0, height: 0, ready: false })

  useEffect(() => {
    const activeIndex = desktopItems.findIndex(item => item.href === pathname)
    if (activeIndex === -1) { setPill(p => ({ ...p, ready: false })); return }
    const el = itemRefs.current[activeIndex]
    if (!el) return
    setPill({ top: el.offsetTop, height: el.offsetHeight, ready: true })
  }, [pathname])

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[264px] shrink-0 bg-gray-100 min-h-screen flex-col p-3">
        <div className="px-3 py-4 mb-2">
          <span className="text-base font-medium text-gray-900 tracking-tight">nubapay</span>
          <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">organizer</span>
        </div>

        <nav ref={navRef} className="flex flex-col gap-2.5 flex-1 relative">
          {/* Sliding pill */}
          <div
            className="absolute inset-x-0 rounded-full bg-gray-900 pointer-events-none"
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.ready ? 1 : 0,
              transition: pill.ready ? 'top 200ms cubic-bezier(0.4,0,0.2,1), height 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms' : 'none',
            }}
          />

          {desktopItems.map((item, i) => {
            const active = pathname === item.href
            return (
              <div key={item.href} ref={el => { itemRefs.current[i] = el }}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm z-10 transition-colors ${
                    active ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-400">demo@nubapay.com</p>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
