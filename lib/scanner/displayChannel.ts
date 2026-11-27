/**
 * Canal entre el escáner y la "pantalla para el público" (otra ventana del mismo navegador, por ejemplo en un
 * segundo monitor). Usa BroadcastChannel: no pasa por el servidor y llega al instante. Si el navegador no lo
 * soporta, no se publica nada y el escáner sigue funcionando igual.
 */

export const SCANNER_DISPLAY_CHANNEL = 'nubapay-scanner-display'
export const SCANNER_DISPLAY_PATH = '/pantalla-escaner'

export type ScanDisplayMessage = {
  /**
   * `ok`: pasó (verde). `pending`: no pasa todavía pero se resuelve ahí mismo, como cobrar el efectivo
   * (naranja). `error`: no pasa (rojo).
   */
  result: 'ok' | 'pending' | 'error'
  /** Texto grande principal: la patente o, si no hay, el número de pedido. */
  headline: string
  /** Debajo: tipo de vehículo / lo que retira. */
  detail?: string
  /** Nombre del titular. */
  name?: string
  /** Motivo, en los errores. */
  reason?: string
  at: number
}

function channel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(SCANNER_DISPLAY_CHANNEL)
  } catch {
    return null
  }
}

export function publishScan(msg: ScanDisplayMessage): void {
  const ch = channel()
  if (!ch) return
  ch.postMessage(msg)
  ch.close()
}

/** Escucha las lecturas; devuelve la función para dejar de escuchar. */
export function subscribeScans(onMessage: (msg: ScanDisplayMessage) => void): () => void {
  const ch = channel()
  if (!ch) return () => {}
  ch.onmessage = e => onMessage(e.data as ScanDisplayMessage)
  return () => ch.close()
}

/** Abre (o trae al frente) la ventana de la pantalla para el público. */
export function openScannerDisplay(): void {
  window.open(SCANNER_DISPLAY_PATH, 'nubapay-scanner-display', 'popup,width=1000,height=640')
}
