import { render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'

import SiteFooter from '@/components/SiteFooter'
import Footer from '@/components/landing-v2/Footer'
import { LEGAL_ENTITY, LEGAL_OPERATOR_LINE } from '@/lib/legalEntity'

jest.mock('@/components/landing-v2/gsap', () => ({
  gsap: { matchMedia: () => ({ add: () => {} }), timeline: () => ({ from: () => ({ from: () => ({ fromTo: () => ({}) }) }) }) },
  MOTION_OK: '',
  useGSAP: () => {},
}))

describe('Datos del operador en el pie de página', () => {
  it('el footer de la landing muestra titular, CUIT y domicilio', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Nubapay es operada por Alejo Vaquero')
    expect(footer).toHaveTextContent('CUIT 23-46971353-9')
    expect(footer).toHaveTextContent('Bv. Los Andes 665, Piso 2, Dpto. S:E, Barrio Ducasse, 5000 Córdoba, Argentina')
    expect(footer).toHaveTextContent(`© ${new Date().getFullYear()} Nubapay`)
  })

  it('el footer anterior también', () => {
    render(<SiteFooter />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(LEGAL_OPERATOR_LINE)
    expect(footer).toHaveTextContent(LEGAL_ENTITY.address)
  })

  it.each(['app/terminos/page.tsx', 'app/privacidad/page.tsx'])(
    'coincide con lo que dice %s (si cambia uno, hay que cambiar el otro)',
    file => {
      const text = readFileSync(join(process.cwd(), file), 'utf8')
      expect(text).toContain(LEGAL_ENTITY.holder)
      expect(text).toContain(LEGAL_ENTITY.cuit)
      expect(text).toContain(LEGAL_ENTITY.address)
    },
  )
})
