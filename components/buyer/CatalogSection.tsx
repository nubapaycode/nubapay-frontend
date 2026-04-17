interface CatalogSectionProps {
  title: string
  children: React.ReactNode
}

export function CatalogSection({ title, children }: CatalogSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}
