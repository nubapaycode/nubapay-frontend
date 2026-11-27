import { render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'

import SiteFooter from '@/components/SiteFooter'
import Footer from '@/components/landing-v2/Footer'

jest.mock('@/components/landing-v2/gsap', () => ({
  gsap: { matchMedia: () => ({ add: () => {} }), timeline: () => ({ from: () => ({ from: () => ({ fromTo: () => ({}) }) }) }) },
  MOTION_OK: '',
  useGSAP: () => {},
}))

describe('Datos personales del titular fuera de footers y Términos', () => {
  it.each([
    ['footer de la landing', () => render(<Footer />)],
    ['footer anterior', () => render(<SiteFooter />)],
  ])('el %s no muestra nombre, CUIT ni domicilio', (_name, doRender) => {
    doRender()
    const footer = screen.getByRole('contentinfo')
    expect(footer).not.toHaveTextContent('Alejo Vaquero')
    expect(footer).not.toHaveTextContent('23-46971353-9')
    expect(footer).not.toHaveTextContent('Los Andes')
  })

  it.each(['app/terminos/page.tsx', 'app/privacidad/page.tsx'])('%s no los menciona y sigue dando un contacto', file => {
    const text = readFileSync(join(process.cwd(), file), 'utf8')
    expect(text).not.toContain('Alejo Vaquero')
    expect(text).not.toContain('23-46971353-9')
    expect(text).not.toContain('Bv. Los Andes')
    expect(text).toContain('contacto@nubapay.app')
  })
})
