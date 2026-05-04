interface CatalogSectionProps {
  title: string
  children: React.ReactNode
}

export function CatalogSection({ title, children }: CatalogSectionProps) {
  return (
    <section className="mb-10">
      <h2
        className="mb-3 text-[15px] font-bold tracking-tight text-[#0A0A0F]"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
    </section>
  )
}
