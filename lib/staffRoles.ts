import type { OrganizerStaffTools } from '@/lib/authSession'

/** Rol sin tildes, mayúsculas ni espacios de más, para comparar. */
export function normalizeRole(role: string): string {
  return role
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/**
 * Dos roles son "el mismo" si normalizados son iguales o casi iguales
 * (errores de tipeo o género: "acreditador general" / "acreditadora general" / "acrediacion general").
 */
export function similarRoles(a: string, b: string): boolean {
  const na = normalizeRole(a)
  const nb = normalizeRole(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const longest = Math.max(na.length, nb.length)
  // Tolerancia proporcional: ~20 % del largo, con mínimo 1 y máximo 3 cambios.
  const tolerance = Math.min(3, Math.max(1, Math.floor(longest * 0.2)))
  return levenshtein(na, nb) <= tolerance
}

export type RoleVariant = { role: string; count: number }

/** Cuenta cuántos integrantes tienen cada rol (tal cual está escrito), de mayor a menor. */
export function roleCounts(roles: string[]): RoleVariant[] {
  const map = new Map<string, number>()
  for (const r of roles) {
    const role = r.trim()
    if (!role) continue
    map.set(role, (map.get(role) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role))
}

/** Herramientas más comunes entre quienes tienen un rol (para copiarlas al invitar a alguien con ese rol). */
export function typicalToolsForRole<T extends { role: string; tools: OrganizerStaffTools }>(
  rows: T[],
  role: string,
): OrganizerStaffTools | null {
  const matches = rows.filter(r => similarRoles(r.role, role))
  if (matches.length === 0) return null
  const byKey = new Map<string, { tools: OrganizerStaffTools; n: number }>()
  for (const m of matches) {
    const key = JSON.stringify(m.tools)
    const entry = byKey.get(key)
    if (entry) entry.n += 1
    else byKey.set(key, { tools: m.tools, n: 1 })
  }
  return [...byKey.values()].sort((a, b) => b.n - a.n)[0].tools
}
