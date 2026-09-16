import type { OrganizerStaffTools } from '@/lib/authSession'

export type WorkspaceSectionKey = 'catalogo' | 'cobros'

export type WorkspaceSectionTab = {
  /** Segmento de ruta bajo `/events/:eventId/`. */
  segment: string
  label: string
  /** Permiso requerido (omitir solo para pestañas `ownerOnly`). */
  tool?: keyof OrganizerStaffTools
  /** Solo visible para el dueño del evento. */
  ownerOnly?: boolean
}

export type WorkspaceSectionAccess = {
  membership: 'owner' | 'staff'
  tools: OrganizerStaffTools
}

/**
 * Secciones con página propia de entrada (tarjetas) en lugar de pestañas.
 * El sidebar apunta a esa página y cada herramienta tiene un link para volver.
 */
export const WORKSPACE_SECTION_HUBS: Partial<Record<WorkspaceSectionKey, string>> = {
  cobros: 'cobros',
}

/** Herramientas agrupadas en una sola entrada del sidebar (con pestañas o con página de entrada). */
export const WORKSPACE_SECTIONS: Record<WorkspaceSectionKey, WorkspaceSectionTab[]> = {
  catalogo: [
    { segment: 'products', label: 'Productos', tool: 'products' },
    { segment: 'blocks', label: 'Bloques', tool: 'products' },
  ],
  cobros: [
    { segment: 'payments', label: 'Pagos', tool: 'payments' },
    { segment: 'metodos-pago', label: 'Métodos de pago', ownerOnly: true },
    { segment: 'comision', label: 'Comisión', ownerOnly: true },
  ],
}

export function visibleSectionTabs(
  section: WorkspaceSectionKey,
  access: WorkspaceSectionAccess,
): WorkspaceSectionTab[] {
  return WORKSPACE_SECTIONS[section].filter(tab => {
    if (tab.ownerOnly) return access.membership === 'owner'
    return tab.tool ? Boolean(access.tools[tab.tool]) : false
  })
}
