/** Zona fija para que el render del servidor y del navegador coincidan (precios en ARS). */
const EVENT_TIME_ZONE = 'America/Argentina/Buenos_Aires'

function parse(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

function part(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: EVENT_TIME_ZONE, ...options }).format(date).replace('.', '')
}

/** Partes sueltas de la fecha del evento (`mié`, `15`, `jul`, `15:00`), o null si no hay fecha. */
export function eventDateParts(iso: string) {
  const date = parse(iso)
  if (!date) return null
  return {
    weekday: part(date, { weekday: 'short' }),
    day: part(date, { day: 'numeric' }),
    month: part(date, { month: 'short' }),
    time: part(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  }
}

/** "15 de julio de 2026 a las 15:00", o '' si no hay fecha. */
export function formatEventDateLong(iso: string): string {
  const date = parse(iso)
  if (!date) return ''
  const day = part(date, { day: 'numeric', month: 'long', year: 'numeric' })
  return `${day} a las ${part(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`
}
