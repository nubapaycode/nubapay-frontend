import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocArticleView } from '@/components/organizer/docs/DocArticleView'
import { DOC_ARTICLES, getDocArticle } from '@/lib/docs/organizerDocs'
import { pageMeta } from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ evento?: string | string[] }>
}

export function generateStaticParams() {
  return DOC_ARTICLES.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getDocArticle(slug)
  if (!article) return pageMeta({ title: 'Documentación', description: 'Guías del panel de Nubapay.' })
  return pageMeta({ title: `${article.title} · Documentación`, description: article.summary })
}

export default async function DocArticlePage({ params, searchParams }: Props) {
  const { slug } = await params
  if (!getDocArticle(slug)) notFound()
  const { evento } = await searchParams
  const eventId = typeof evento === 'string' && evento.trim() ? evento.trim() : undefined
  return <DocArticleView eventId={eventId} slug={slug} />
}
