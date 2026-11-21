const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function formatUuid(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase()
}

/**
 * Saca el id del pedido de lo que leyó el QR. Hoy el QR lleva solo el uuid; los QR emitidos antes
 * traían una URL `.../order/<uuid>`, que se sigue aceptando.
 *
 * Un lector físico "teclea" el código, y si su distribución de teclado no coincide con la del
 * sistema deforma símbolos: los `-` del uuid pueden llegar como `/` (`6fe14fc6/3227/4751/...`) y
 * `https://` también sale mal. Por eso, si no hay un uuid bien formado, se toman los dígitos
 * hexadecimales que siguen a `order` ignorando los separadores.
 */
export function extractOrderId(data: string): string | null {
  const uuid = data.match(UUID_RE)?.[0]
  if (uuid) return uuid.toLowerCase()

  // Con `order` en el texto (URL) se miran los dígitos que lo siguen; si no, es un id suelto deformado.
  const tail = data.split(/order/i).slice(1).pop() ?? data
  const hex = tail.replace(/[^0-9a-f]/gi, '')
  if (hex.length === 32) return formatUuid(hex)

  try {
    const parts = new URL(data).pathname.split('/')
    const idx = parts.indexOf('order')
    return idx !== -1 ? parts[idx + 1] || null : null
  } catch {
    return data.trim() || null
  }
}
