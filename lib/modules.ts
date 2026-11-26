/**
 * Módulos que un usuario puede usar. Los define el admin de plataforma (backend: services/modules.py).
 * Un evento ofrece los módulos de su dueño; el staff trabaja con lo que el dueño tiene.
 */
export type ModuleKey = 'catalogo' | 'tickets' | 'parking' | 'parking_owner'

export const ALL_MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: 'catalogo', label: 'Catálogo', description: 'Productos y combos con retiro por QR' },
  { key: 'tickets', label: 'Tickets', description: 'Entradas con cupo y precio' },
  { key: 'parking', label: 'Parking', description: 'Estacionamiento por tipo de vehículo, con mapa' },
  {
    key: 'parking_owner',
    label: 'Dueño de estacionamiento',
    description: 'Panel global del estacionamiento: recibe solicitudes de evento y las aprueba',
  },
]

/** Módulos que ofrece un evento. `parking_owner` es un permiso de cuenta, no una herramienta de evento. */
export type EventModuleKey = Exclude<ModuleKey, 'parking_owner'>

export const EVENT_MODULES = ALL_MODULES.filter(
  (m): m is (typeof ALL_MODULES)[number] & { key: EventModuleKey } => m.key !== 'parking_owner',
)

/** Pantalla de inicio del dueño de estacionamiento. */
export const PARKING_OWNER_HOME = '/estacionamiento'

/** Lo que tiene un usuario sin configuración explícita (cuentas existentes y respuestas viejas del backend). */
export const DEFAULT_MODULES: ModuleKey[] = ['catalogo', 'tickets']

export function hasModule(modules: readonly string[] | null | undefined, key: ModuleKey): boolean {
  return (modules ?? DEFAULT_MODULES).includes(key)
}

/** Dueño de estacionamiento: tiene el permiso de cuenta `parking_owner`. */
export function isParkingOwner(user: { modules?: readonly string[] | null } | null | undefined): boolean {
  return !!user && hasModule(user.modules, 'parking_owner')
}
