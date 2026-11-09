'use client'

import { useEffect, useState } from 'react'

import { Modal } from '@/components/ui/Modal'

import { OPEN_SHORTCUTS_EVENT } from './commandEvents'

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

function shortcutGroups(mod: string): { title: string; items: { keys: string[]; label: string }[] }[] {
  return [
    {
      title: 'General',
      items: [
        { keys: [mod, 'K'], label: 'Buscar y comandos' },
        { keys: ['?'], label: 'Ver atajos de teclado' },
        { keys: ['Esc'], label: 'Cerrar diálogos y paneles' },
      ],
    },
    {
      title: 'Navegación',
      items: [
        { keys: ['G', 'D'], label: 'Ir al Dashboard' },
        { keys: ['G', 'P'], label: 'Ir a Pedidos' },
        { keys: ['G', 'C'], label: 'Ir al Catálogo' },
        { keys: ['G', 'T'], label: 'Ir a Tickets' },
        { keys: ['G', 'R'], label: 'Ir a Puntos de retiro' },
        { keys: ['G', 'B'], label: 'Ir a Cobros' },
        { keys: ['G', 'S'], label: 'Abrir el escáner' },
        { keys: ['G', 'E'], label: 'Ir a Equipo' },
        { keys: ['G', 'A'], label: 'Ir a Configuración' },
        { keys: ['['], label: 'Plegar o expandir la barra lateral' },
      ],
    },
    {
      title: 'Buscador',
      items: [
        { keys: ['↑', '↓'], label: 'Moverse entre resultados' },
        { keys: ['Enter'], label: 'Abrir el resultado' },
      ],
    },
    {
      title: 'Pedidos',
      items: [{ keys: ['/'], label: 'Enfocar el buscador de pedidos' }],
    },
  ]
}

export function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null
  return !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable)
}

/** Lista de atajos del panel. Se abre con "?" o con el evento global (desde la card del perfil). */
export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)
  const [mod, setMod] = useState('Ctrl')

  useEffect(() => {
    queueMicrotask(() => setMod(isMac() ? '⌘' : 'Ctrl'))
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      setOpen(o => !o)
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpen)
    }
  }, [])

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Atajos de teclado" containerClassName="z-[70]">
      <div className="flex flex-col gap-5">
        {shortcutGroups(mod).map(group => (
          <section key={group.title}>
            <p className="mb-1.5 text-[11px] font-medium text-gray-400">{group.title}</p>
            <ul className="divide-y divide-gray-100">
              {group.items.map(item => (
                <li key={item.label} className="flex items-center justify-between gap-4 py-2 text-[13px] text-gray-700">
                  {item.label}
                  <span className="flex shrink-0 gap-1">
                    {item.keys.map(k => (
                      <kbd
                        key={k}
                        className="min-w-[22px] rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-center font-sans text-[11px] font-semibold text-gray-500"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}
