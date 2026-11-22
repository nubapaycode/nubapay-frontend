import { isGoogleMapsUrl, mapsEmbedUrl } from '@/lib/googleMaps'

describe('isGoogleMapsUrl', () => {
  it.each([
    'https://maps.app.goo.gl/abc123',
    'https://www.google.com/maps/place/Parking+Norte/@-34.6,-58.4,17z',
    'https://goo.gl/maps/xyz',
    'https://maps.google.com/?q=-34.6,-58.4',
    'https://www.google.com/maps/embed?pb=!1m18',
  ])('acepta %s', url => {
    expect(isGoogleMapsUrl(url)).toBe(true)
  })

  it.each([
    '',
    'maps.app.goo.gl/abc',
    'http://maps.google.com/?q=1',
    'javascript:alert(1)',
    'https://evil.com/maps',
    'https://www.google.com/search?q=parking',
    'https://maps.app.goo.gl/a b',
  ])('rechaza %j', url => {
    expect(isGoogleMapsUrl(url)).toBe(false)
  })
})

describe('mapsEmbedUrl', () => {
  it('arma el mapa a partir de las coordenadas del link', () => {
    expect(mapsEmbedUrl('https://www.google.com/maps/place/X/@-34.6037,-58.3816,17z')).toBe(
      'https://www.google.com/maps?q=-34.6037%2C-58.3816&output=embed',
    )
  })

  it('prefiere el pin exacto (!3d/!4d) al centro de la vista (@)', () => {
    // Link real de Coco una vez resuelto: el `@` queda corrido respecto del pin.
    const resolved =
      "https://www.google.com/maps/place/31%C2%B022'40.0%22S+64%C2%B014'42.5%22W/@-31.377768,-64.2477219,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-31.377768!4d-64.245147?entry=tts"
    expect(mapsEmbedUrl(resolved)).toBe('https://www.google.com/maps?q=-31.377768%2C-64.245147&output=embed')
  })

  it('usa la búsqueda q= o query=', () => {
    expect(mapsEmbedUrl('https://maps.google.com/?q=Parking%20Norte')).toBe(
      'https://www.google.com/maps?q=Parking%20Norte&output=embed',
    )
    expect(mapsEmbedUrl('https://www.google.com/maps/search/?api=1&query=Estadio')).toBe(
      'https://www.google.com/maps?q=Estadio&output=embed',
    )
  })

  it('usa el nombre del lugar cuando no hay coordenadas', () => {
    expect(mapsEmbedUrl('https://www.google.com/maps/place/Parking+Norte/data=x')).toBe(
      'https://www.google.com/maps?q=Parking%20Norte&output=embed',
    )
  })

  it('deja pasar un link de embed tal cual', () => {
    const url = 'https://www.google.com/maps/embed?pb=!1m18'
    expect(mapsEmbedUrl(url)).toBe(url)
  })

  it('no inventa el mapa de un link corto ni de un link inválido', () => {
    expect(mapsEmbedUrl('https://maps.app.goo.gl/abc123')).toBeNull()
    expect(mapsEmbedUrl('https://evil.com/maps/@1,2')).toBeNull()
    expect(mapsEmbedUrl(null)).toBeNull()
  })
})
