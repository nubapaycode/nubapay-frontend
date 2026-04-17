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

  it('chip activa tiene clase bg-gray-900', () => {
    render(<CategoryFilter categories={categories} active="Comidas" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Comidas' })).toHaveClass('bg-gray-900')
  })

  it('chip inactiva no tiene clase bg-gray-900', () => {
    render(<CategoryFilter categories={categories} active="all" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Comidas' })).not.toHaveClass('bg-gray-900')
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
