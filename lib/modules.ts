/**
 * Módulos que un usuario puede usar. Los define el admin de plataforma (backend: services/modules.py).
 * Un evento ofrece los módulos de su dueño; el staff trabaja con lo que el dueño tiene.
 */
export type ModuleKey = 'catalogo' | 'tickets' | 'parking'

export const ALL_MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: 'catalogo', label: 'Catálogo', description: 'Productos y combos con retiro por QR' },
  { key: 'tickets', label: 'Tickets', description: 'Entradas con cupo y precio' },
  { key: 'parking', label: 'Parking', description: 'Estacionamiento por tipo de vehículo, con mapa' },
]

/** Lo que tiene un usuario sin configuración explícita (cuentas existentes y respuestas viejas del backend). */
export const DEFAULT_MODULES: ModuleKey[] = ['catalogo', 'tickets']

export function hasModule(modules: readonly string[] | null | undefined, key: ModuleKey): boolean {
  return (modules ?? DEFAULT_MODULES).includes(key)
}
