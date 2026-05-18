import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter } from '@/components/buyer/CategoryFilter'

const categories = ['Comidas', 'Bebidas']

describe('CategoryFilter', () => {
  it('siempre muestra la chip "Todos"', () => {
    render(<CategoryFilter categories={categories} active="all" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
  })

  it('muestra una chip por cada categoría', () => {
    render(<CategoryFilter categories={categories} active="all" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Comidas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bebidas' })).toBeInTheDocument()
  })

  it('chip activa usa inline style de accent (no texto bg-gray-900)', () => {
    render(<CategoryFilter categories={categories} active="Comidas" onChange={jest.fn()} />)
    const btn = screen.getByRole('button', { name: 'Comidas' })
    // La chip activa aplica estilos inline, no clases de Tailwind
    expect(btn).toHaveAttribute('style')
    expect(btn.getAttribute('style')).toContain('background')
  })

  it('chip inactiva tiene borde visible', () => {
    render(<CategoryFilter categories={categories} active="all" onChange={jest.fn()} />)
    const btn = screen.getByRole('button', { name: 'Comidas' })
    expect(btn.getAttribute('style')).toContain('border')
  })

  it('llama onChange con la categoría al hacer click', async () => {
    const handleChange = jest.fn()
    render(<CategoryFilter categories={categories} active="all" onChange={handleChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Comidas' }))
    expect(handleChange).toHaveBeenCalledWith('Comidas')
  })

  it('llama onChange con "all" al hacer click en Todos', async () => {
    const handleChange = jest.fn()
    render(<CategoryFilter categories={categories} active="Comidas" onChange={handleChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(handleChange).toHaveBeenCalledWith('all')
  })
})
