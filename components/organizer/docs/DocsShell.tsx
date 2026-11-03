'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DOC_ARTICLES, DOC_GROUPS, type DocArticle } from '@/lib/docs/organizerDocs'
import { cn } from '@/lib/utils'

const ACCENT = 'var(--organizer-accent, #C6FF00)'

const DOC_STYLES = `
@keyframes doc-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes doc-spot-ping { 0% { transform: scale(1); opacity: .55; } 80%, 100% { transform: scale(2.6); opacity: 0; } }
.doc-fade-in { animation: doc-fade-in 220ms cubic-bezier(.2,.7,.2,1) backwards; }
.doc-spot-ping { animation: doc-spot-ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .doc-fade-in, .doc-spot-ping { animation: none; }
  .doc-spot-ping { opacity: 0; }
}
`

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Texto en el que busca el filtro: título, resumen y pasos. */
function haystack(a: DocArticle) {
  return normalize([a.title, a.summary, a.location ?? '', ...a.steps.map(s => `${s.title} ${s.body}`), ...(a.notes ?? [])].join(' '))
}

/** Ruta de una guía. Con `eventId`, la conserva como `?evento=` para volver al panel y abrir cada herramienta. */
export function docsHref(slug?: string, eventId?: string) {
  const path = slug ? `/documentacion/${slug}` : '/documentacion'
  return eventId ? `${path}?evento=${encodeURIComponent(eventId)}` : path
}

/**
 * Armazón de la documentación: navegación por secciones (lateral en escritorio,
 * fila deslizable en celular) y el contenido al lado.
 */
export function DocsShell({
  eventId,
  activeSlug,
  children,
}: {
  eventId?: string
  activeSlug?: string
  children: React.ReactNode
}) {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const chipsRef = useRef<HTMLElement>(null)

  // En celular, la fila de guías arranca mostrando la guía abierta.
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!el || !chipsRef.current) return
    chipsRef.current.scrollLeft = el.offsetLeft - 16
  }, [activeSlug])

  const index = useMemo(() => DOC_ARTICLES.map(a => ({ a, text: haystack(a) })), [])
  const visible = q ? index.filter(x => x.text.includes(q)).map(x => x.a) : DOC_ARTICLES

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <style>{DOC_STYLES}</style>

      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-[#F7F7F8]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center gap-3 px-4 md:px-8">
          <Link href={docsHref(undefined, eventId)} className="flex items-center gap-2.5" aria-label="Documentación de Nubapay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nubapay.svg" alt="nubapay" width={75} height={26} className="h-[22px] w-auto" />
            <span className="h-4 w-px bg-gray-300" aria-hidden />
            <span className="text-[13px] font-medium text-gray-600">Documentación</span>
          </Link>
          {eventId ? (
            <Link
              href={`/eventos/${encodeURIComponent(eventId)}/resumen`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft size={13} aria-hidden />
              Volver al panel
            </Link>
          ) : (
            <Link
              href="/eventos"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              Ir al panel
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 md:px-8 md:pt-10">

      {/* Celular: todas las guías en una fila deslizable */}
      <nav
        ref={chipsRef}
        className="-mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none]"
        aria-label="Guías de la documentación"
      >
        <Link
          href={docsHref(undefined, eventId)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            !activeSlug ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600',
          )}
        >
          Inicio
        </Link>
        {DOC_ARTICLES.map(a => (
          <Link
            key={a.slug}
            href={docsHref(a.slug, eventId)}
            aria-current={a.slug === activeSlug ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
              a.slug === activeSlug ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600',
            )}
          >
            {a.title}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[212px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Link
              href={docsHref(undefined, eventId)}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors',
                !activeSlug ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              <BookOpen size={15} strokeWidth={1.75} aria-hidden />
              Documentación
            </Link>

            <label className="relative mb-5 block">
              <span className="sr-only">Buscar en la documentación</span>
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar en las guías…"
                className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-7 text-[12.5px] text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:text-gray-700"
                  aria-label="Borrar búsqueda"
                >
                  <X size={12} aria-hidden />
                </button>
              ) : null}
            </label>

            <nav aria-label="Guías de la documentación" className="max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
              {visible.length === 0 ? (
                <p className="px-2 text-[12.5px] text-gray-400">Ninguna guía coincide con “{query}”.</p>
              ) : (
                DOC_GROUPS.map(g => {
                  const items = visible.filter(a => a.group === g.key)
                  if (items.length === 0) return null
                  return (
                    <div key={g.key} className="mb-4">
                      <p className="mb-1 px-2 text-[11px] font-medium text-gray-400">{g.label}</p>
                      <ul>
                        {items.map(a => {
                          const active = a.slug === activeSlug
                          return (
                            <li key={a.slug}>
                              <Link
                                href={docsHref(a.slug, eventId)}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'relative flex items-center rounded-lg px-2 py-1.5 text-[13px] transition-colors',
                                  active ? 'bg-white font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-gray-200/80' : 'text-gray-600 hover:bg-white/70 hover:text-gray-900',
                                )}
                              >
                                {active ? (
                                  <span className="absolute -left-0.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
                                ) : null}
                                <span className="truncate">{a.title}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })
              )}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
      </div>
    </div>
  )
}
