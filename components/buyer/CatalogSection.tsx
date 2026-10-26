interface CatalogSectionProps {
  title: string
  children: React.ReactNode
  /** Clases del grid de ítems (por defecto, 2 columnas en mobile y 4 en desktop). */
  gridClassName?: string
}

export function CatalogSection({ title, children, gridClassName = 'grid-cols-2 md:grid-cols-4' }: CatalogSectionProps) {
  return (
    <section className="mb-10">
      <h2
        className="mb-3 text-[15px] font-bold tracking-tight text-[#0A0A0F]"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      <div className={`grid gap-3 ${gridClassName}`}>{children}</div>
    </section>
  )
}
