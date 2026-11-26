import { extractOrderId } from './extractOrderId'

const UUID_RE_G = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

/**
 * Ids de pedido en lo que tecleó el lector. Si llegaron dos códigos pegados (dos lectores a la vez, o un
 * lector sin Enter al final) se devuelven los dos; si no hay ninguno bien formado se intenta rescatar uno
 * deformado (ver `extractOrderId`). `[]` = no se reconoció nada.
 */
export function extractOrderIds(data: string): string[] {
  const found = data.match(UUID_RE_G)
  if (found && found.length > 0) return [...new Set(found.map(id => id.toLowerCase()))]
  const one = extractOrderId(data)
  return one && /^[0-9a-f-]{36}$/i.test(one) ? [one.toLowerCase()] : []
}
