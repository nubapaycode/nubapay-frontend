/**
 * Fechas del backend. La base guarda UTC en columnas sin zona y la API las devuelve sin sufijo
 * ("2026-11-03T15:00:00"); el navegador las leería como hora local y las mostraría corridas
 * (3 h en Argentina). Todo lo que se muestra al organizador y al comprador sale en hora argentina,
 * sin depender de la zona del dispositivo.
 */
export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires'

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/

/** Interpreta un timestamp de la API como UTC cuando no trae zona. */
export function parseApiDate(iso: string): Date {
  if (!iso.includes('T') || HAS_ZONE.test(iso)) return new Date(iso)
  return new Date(`${iso}Z`)
}

const TIME_FMT = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const DAY_MONTH_FMT = new Intl.DateTimeFormat('es-AR', { timeZone: AR_TIME_ZONE, day: '2-digit', month: '2-digit' })
const DAY_MONTH_SHORT_FMT = new Intl.DateTimeFormat('es-AR', { timeZone: AR_TIME_ZONE, day: '2-digit', month: 'short' })
const DAY_KEY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: AR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "20:12" */
export function formatArTime(d: Date): string {
  return TIME_FMT.format(d)
}

/** "26/10" */
export function formatArDayMonth(d: Date): string {
  return DAY_MONTH_FMT.format(d)
}

/** "26 oct" */
export function formatArDayMonthShort(d: Date): string {
  return DAY_MONTH_SHORT_FMT.format(d)
}

/** "2026-10-26": para comparar si dos instantes caen el mismo día argentino. */
export function arDayKey(d: Date): string {
  return DAY_KEY_FMT.format(d)
}

/** Fecha y hora completas en hora argentina, con las opciones de `Intl` que se pasen. */
export function formatArDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof value === 'string' ? parseApiDate(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-AR', {
    timeZone: AR_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...options,
  })
}
