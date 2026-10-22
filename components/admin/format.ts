const nf = new Intl.NumberFormat('es-AR')

export function fmtInt(n: number): string {
  return nf.format(Math.round(n))
}

/** 1.284 / 12,9 mil / $ 4,2 M — para tiles y ejes. */
export function fmtCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} M`
  if (abs >= 10_000) return `${Math.round(n / 1000)} mil`
  if (abs >= 1_000) return `${(n / 1000).toFixed(1).replace('.', ',')} mil`
  return nf.format(Math.round(n))
}

export function fmtMoneyCompact(n: number): string {
  return `$ ${fmtCompact(n)}`
}

/** '2026-10-22' -> 22 oct (sin pasar por Date para no correr el día por zona horaria). */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`
}

export function fmtDayLong(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''} ${y}`
}

export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return '—'
  const diff = Math.max(0, now - new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export function ageLabel(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  if (minutes < 60 * 48) return `${Math.floor(minutes / 60)} h`
  return `${Math.floor(minutes / 1440)} d`
}

/** Fecha local YYYY-MM-DD (para inputs type=date y rangos). */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** El backend guarda UTC naive (sin 'Z'); se interpreta como UTC y se muestra en hora Argentina. */
export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function plural(n: number, one: string, many: string): string {
  return `${fmtInt(n)} ${n === 1 ? one : many}`
}
