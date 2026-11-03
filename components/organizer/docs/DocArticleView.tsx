'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Lightbulb, MapPin, ShieldCheck } from 'lucide-react'

import { DocThumb } from '@/components/organizer/docs/DocThumb'
import { DocWalkthrough } from '@/components/organizer/docs/DocWalkthrough'
import { DocsShell, docsHref } from '@/components/organizer/docs/DocsShell'
import { DOC_GROUPS, getAdjacentArticles, getDocArticle, type DocArticle } from '@/lib/docs/organizerDocs'

function groupLabel(a: DocArticle) {
  return DOC_GROUPS.find(g => g.key === a.group)?.label ?? ''
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 scroll-mt-8 text-[17px] font-semibold tracking-[-0.02em] text-gray-900">
      {children}
    </h2>
  )
}

function RelatedCard({ eventId, slug }: { eventId?: string; slug: string }) {
  const a = getDocArticle(slug)
  if (!a) return null
  const cover = a.steps[0]?.image
  return (
    <Link
      href={docsHref(a.slug, eventId)}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 pr-3 transition-colors hover:border-gray-300"
    >
      {cover ? (
        <span className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
          <DocThumb image={cover} sizes="96px" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-gray-900">{a.title}</span>
        <span className="block truncate text-[12px] text-gray-500">{a.summary}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" aria-hidden />
    </Link>
  )
}

export function DocArticleView({ eventId, slug }: { eventId?: string; slug: string }) {
  const article = getDocArticle(slug)
  if (!article) return null
  const { prev, next } = getAdjacentArticles(slug)


  return (
    <DocsShell eventId={eventId} activeSlug={slug}>
      <div>
        <article className="min-w-0 max-w-[1040px]">
          <header className="mb-6">
            <p className="mb-2 text-[12px] text-gray-400">
              <Link href={docsHref(undefined, eventId)} className="hover:text-gray-700">Documentación</Link>
              <span className="mx-1.5" aria-hidden>/</span>
              {groupLabel(article)}
            </p>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-gray-900 sm:text-[32px]">
              {article.title}
            </h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-gray-500">{article.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {article.location ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[12px] text-gray-600">
                  <MapPin size={12} strokeWidth={2} className="text-gray-400" aria-hidden />
                  {article.location}
                </span>
              ) : null}
              {article.access ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[12px] text-gray-600">
                  <ShieldCheck size={12} strokeWidth={2} className="text-gray-400" aria-hidden />
                  {article.access}
                </span>
              ) : null}
              {article.toolPath && eventId ? (
                <Link
                  href={`/eventos/${eventId}/${article.toolPath}`}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Abrir {article.title.toLowerCase()}
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              ) : null}
            </div>
          </header>

          <section className="mb-10">
            <SectionTitle id="como-funciona">Cómo funciona</SectionTitle>
            <DocWalkthrough key={article.slug} steps={article.steps} />
            <p className="mt-2 text-[12px] text-gray-400">
              Tocá un paso o usá las flechas ← → para avanzar. Las capturas usan datos de ejemplo.
            </p>
          </section>

          {article.notes?.length ? (
            <section className="mb-10">
              <SectionTitle id="a-tener-en-cuenta">A tener en cuenta</SectionTitle>
              <ul className="space-y-2.5">
                {article.notes.map(n => (
                  <li key={n} className="flex gap-3 text-[14px] leading-relaxed text-gray-600">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden />
                    <span className="max-w-[68ch]">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {article.tips?.length ? (
            <section className="mb-10">
              <SectionTitle id="consejos">Consejos</SectionTitle>
              <div className="space-y-2">
                {article.tips.map(t => (
                  <div key={t} className="flex gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] leading-relaxed text-gray-700">
                    <Lightbulb size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {article.related?.length ? (
            <section className="mb-10">
              <SectionTitle id="relacionadas">Guías relacionadas</SectionTitle>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {article.related.map(s => (
                  <RelatedCard key={s} eventId={eventId} slug={s} />
                ))}
              </div>
            </section>
          ) : null}

          <nav className="grid grid-cols-1 gap-2 border-t border-gray-200 pt-6 sm:grid-cols-2" aria-label="Otras guías">
            {prev ? (
              <Link href={docsHref(prev.slug, eventId)} className="group rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300">
                <span className="flex items-center gap-1 text-[12px] text-gray-400">
                  <ArrowLeft size={12} aria-hidden /> Anterior
                </span>
                <span className="mt-0.5 block truncate text-[14px] font-medium text-gray-900">{prev.title}</span>
              </Link>
            ) : <span className="hidden sm:block" />}
            {next ? (
              <Link href={docsHref(next.slug, eventId)} className="group rounded-xl border border-gray-200 bg-white px-4 py-3 text-right transition-colors hover:border-gray-300">
                <span className="flex items-center justify-end gap-1 text-[12px] text-gray-400">
                  Siguiente <ArrowRight size={12} aria-hidden />
                </span>
                <span className="mt-0.5 block truncate text-[14px] font-medium text-gray-900">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        </article>

      </div>
    </DocsShell>
  )
}
