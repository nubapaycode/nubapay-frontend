import { notFound } from 'next/navigation'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { ProductDetailView } from '@/components/buyer/ProductDetailView'

type Props = { params: Promise<{ slug: string; productId: string }> }

export default async function ProductoPage({ params }: Props) {
  const { slug, productId } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()

  const product = data.products.find(p => p.id === productId)
  const combo = data.combos.find(c => c.id === productId)
  const item = product ?? combo
  if (!item) notFound()

  return <ProductDetailView item={item} slug={slug} />
}
