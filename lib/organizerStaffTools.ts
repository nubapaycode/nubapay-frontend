import type { OrganizerStaffTools, StaffMembership } from '@/lib/authSession'

export const ORGANIZER_FULL_TOOLS: OrganizerStaffTools = {
  dashboard: true,
  storefront: true,
  products: true,
  scanner: true,
  orders: true,
  pickup_points: true,
  payments: true,
}

export const ORGANIZER_ZERO_TOOLS: OrganizerStaffTools = {
  dashboard: false,
  storefront: false,
  products: false,
  scanner: false,
  orders: false,
  pickup_points: false,
  payments: false,
}

export function workspaceToolsForEvent(
  membership: 'owner' | 'staff' | undefined,
  eventId: string,
  staffMemberships: StaffMembership[] | undefined,
): OrganizerStaffTools {
  if (membership === 'owner') {
    return { ...ORGANIZER_FULL_TOOLS }
  }
  if (membership === 'staff') {
    const m = staffMemberships?.find(x => x.event_id === eventId)
    if (m?.tools) return { ...ORGANIZER_ZERO_TOOLS, ...m.tools }
  }
  return { ...ORGANIZER_ZERO_TOOLS }
}

/** Orden alineado con el panel: primera herramienta permitida para abrir el evento. */
const FIRST_ROUTE_FOR_TOOL: { key: keyof OrganizerStaffTools; segment: string }[] = [
  { key: 'dashboard', segment: 'dashboard' },
  { key: 'storefront', segment: 'storefront' },
  { key: 'products', segment: 'products' },
  { key: 'scanner', segment: 'scanner' },
  { key: 'orders', segment: 'orders' },
  { key: 'pickup_points', segment: 'pickup-points' },
  { key: 'payments', segment: 'payments' },
]

/** Segmento de ruta (`dashboard`, `orders`, …) o `all` si no hay ninguna herramienta activa. */
export function firstAllowedWorkspaceSegment(tools: OrganizerStaffTools): string {
  for (const { key, segment } of FIRST_ROUTE_FOR_TOOL) {
    if (tools[key]) return segment
  }
  return 'all'
}
