/** Agrupa preservando el orden de aparición (los productos ya vienen ordenados por sort_order). */
export function groupProductsByCategory<T extends { category: string }>(products: T[]): { category: string; items: T[] }[] {
  const groups: { category: string; items: T[] }[] = []
  const indexByCategory = new Map<string, number>()
  for (const product of products) {
    const key = product.category || 'Sin categoría'
    let idx = indexByCategory.get(key)
    if (idx === undefined) {
      idx = groups.length
      indexByCategory.set(key, idx)
      groups.push({ category: key, items: [] })
    }
    groups[idx].items.push(product)
  }
  return groups
}
