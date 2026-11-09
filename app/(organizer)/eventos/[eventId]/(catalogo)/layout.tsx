import { WorkspaceSectionTabs } from '@/components/organizer/WorkspaceSectionTabs'

/** Route group sin impacto en la URL: agrupa Productos y Bloques bajo pestañas compartidas. */
export default function CatalogSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkspaceSectionTabs section="catalogo" label="Secciones del catálogo" />
      {children}
    </>
  )
}
