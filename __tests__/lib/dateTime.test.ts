import { formatArDateTime, parseApiDate } from '@/lib/dateTime'
import { fullDateTime, relativeTime } from '@/components/organizer/orders/orderUi'

// Compra a las 12:05 hora argentina = 15:05 UTC. La API la manda sin zona.
const API_ISO = '2026-11-03T15:05:00'

describe('fechas en hora argentina', () => {
  it('interpreta como UTC los timestamps de la API sin zona', () => {
    expect(parseApiDate(API_ISO).toISOString()).toBe('2026-11-03T15:05:00.000Z')
    expect(parseApiDate('2026-11-03T15:05:00Z').toISOString()).toBe('2026-11-03T15:05:00.000Z')
    expect(parseApiDate('2026-11-03T12:05:00-03:00').toISOString()).toBe('2026-11-03T15:05:00.000Z')
  })

  it('muestra la hora de Argentina (12:05), no la UTC ni la del dispositivo', () => {
    expect(fullDateTime(API_ISO)).toMatch(/^0?3.nov · 12:05$/)
    expect(formatArDateTime(API_ISO)).toContain('12:05')
  })

  it('relativeTime cuenta desde el instante real de la compra', () => {
    const at = (iso: string) => Date.parse(iso)
    expect(relativeTime(API_ISO, at('2026-11-03T15:05:30Z'))).toBe('recién')
    expect(relativeTime(API_ISO, at('2026-11-03T15:09:00Z'))).toBe('hace 4 min')
    // más de una hora después, mismo día argentino: solo la hora
    expect(relativeTime(API_ISO, at('2026-11-03T20:00:00Z'))).toBe('12:05')
    // día argentino siguiente (02:00 UTC del 4 = 23:00 del 3 en AR, todavía el mismo día)
    expect(relativeTime(API_ISO, at('2026-11-04T02:00:00Z'))).toBe('12:05')
    expect(relativeTime(API_ISO, at('2026-11-04T04:00:00Z'))).toMatch(/^0?3\/11 · 12:05$/)
  })

  it('un valor inválido no rompe la pantalla', () => {
    expect(fullDateTime('no-es-fecha')).toBe('—')
    expect(relativeTime('no-es-fecha', Date.now())).toBe('—')
  })
})
