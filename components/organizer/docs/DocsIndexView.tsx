'use client'

import Link from 'next/link'
import { ArrowRight, Command } from 'lucide-react'

import { DocThumb } from '@/components/organizer/docs/DocThumb'
import { DocsShell, docsHref } from '@/components/organizer/docs/DocsShell'
import { DOC_ARTICLES, DOC_GROUPS, getDocArticle, type DocArticle } from '@/lib/docs/organizerDocs'

const ACCENT = 'var(--organizer-accent, #C6FF00)'

function ArticleCard({ eventId, article }: { eventId?: string; article: DocArticle }) {
  const cover = article.steps[0]?.image
  return (
    <Link
      href={docsHref(article.slug, eventId)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-gray-300 hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
    >
      <span className="relative block aspect-[16/9] overflow-hidden border-b border-gray-100 bg-gray-50">
        {cover ? (
          <span className="absolute inset-0 origin-top transition-transform duration-300 group-hover:scale-[1.02]">
            <DocThumb image={cover} sizes="(min-width: 1280px) 340px, (min-width: 640px) 45vw, 100vw" />
          </span>
        ) : null}
      </span>
      <span className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-gray-900">{article.title}</span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{article.summary}</span>
        <span className="mt-auto flex items-center justify-between pt-3 text-[12px] text-gray-400">
          {article.steps.length} {article.steps.length === 1 ? 'paso' : 'pasos'}
          <ArrowRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" aria-hidden />
        </span>
      </span>
    </Link>
  )
}

export function DocsIndexView({ eventId }: { eventId?: string }) {
  const start = getDocArticle('primeros-pasos')
  const startCover = start?.steps[2]?.image

  return (
    <DocsShell eventId={eventId}>
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-gray-900 sm:text-[32px]">Documentación</h1>
        <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray-500">
          Cada herramienta del panel, paso a paso y con capturas. Tocá una guía para ver cómo funciona.
        </p>
      </header>

      {start ? (
        <Link
          href={docsHref(start.slug, eventId)}
          className="group mb-12 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-300 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
        >
          <span className="flex flex-col justify-center p-6 sm:p-8">
            <span
              className="mb-4 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-gray-900"
              style={{ backgroundColor: ACCENT }}
            >
              Empezá por acá
            </span>
            <span className="text-[22px] font-semibold tracking-[-0.03em] text-gray-900">{start.title}</span>
            <span className="mt-2 text-[14px] leading-relaxed text-gray-500">{start.summary}</span>
            <ol className="mt-5 space-y-1.5">
              {start.steps.map((s, i) => (
                <li key={s.title} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold tabular-nums text-gray-500">
                    {i + 1}
                  </span>
                  {s.title}
                </li>
              ))}
            </ol>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
              Ver la guía
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </span>
          {startCover ? (
            <span className="relative hidden min-h-[280px] overflow-hidden border-l border-gray-100 bg-gray-50 md:block">
              <span className="absolute inset-y-8 left-8 right-0 overflow-hidden rounded-l-xl border border-r-0 border-gray-200 bg-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.3)]">
                <DocThumb image={startCover} sizes="560px" />
              </span>
            </span>
          ) : null}
        </Link>
      ) : null}

      {DOC_GROUPS.filter(g => g.key !== 'inicio').map(g => {
        const items = DOC_ARTICLES.filter(a => a.group === g.key)
        if (items.length === 0) return null
        return (
          <section key={g.key} className="mb-12" aria-labelledby={`docs-group-${g.key}`}>
            <h2 id={`docs-group-${g.key}`} className="mb-4 text-[13px] font-semibold text-gray-900">
              {g.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(a => (
                <ArticleCard key={a.slug} eventId={eventId} article={a} />
              ))}
            </div>
          </section>
        )
      })}

      <Link
        href={docsHref('buscador', eventId)}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-5 py-4 text-[13.5px] text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          <Command size={15} aria-hidden />
        </span>
        <span>
          <span className="font-medium text-gray-900">Atajo:</span> apretá ⌘K (o Ctrl+K) en cualquier pantalla para buscar pedidos o saltar a una herramienta.
        </span>
      </Link>
    </DocsShell>
  )
}
