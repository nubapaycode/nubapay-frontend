import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationBar } from '@/components/ui/PaginationBar'

describe('PaginationBar', () => {
  it('renderiza con aria-label de navegación', () => {
    render(<PaginationBar page={1} pageSize={10} total={30} onPageChange={jest.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
  })

  it('muestra los botones de página correctos', () => {
    render(<PaginationBar page={1} pageSize={10} total={30} onPageChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('botón anterior está deshabilitado en la primera página', () => {
    render(<PaginationBar page={1} pageSize={10} total={30} onPageChange={jest.fn()} />)
    const [prev] = screen.getAllByRole('button')
    expect(prev).toBeDisabled()
  })

  it('botón siguiente está deshabilitado en la última página', () => {
    render(<PaginationBar page={3} pageSize={10} total={30} onPageChange={jest.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[buttons.length - 1]).toBeDisabled()
  })

  it('llama onPageChange al hacer click en una página', async () => {
    const onPageChange = jest.fn()
    render(<PaginationBar page={1} pageSize={10} total={30} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('llama onPageChange con página anterior al hacer click en "anterior"', async () => {
    const onPageChange = jest.fn()
    render(<PaginationBar page={2} pageSize={10} total={30} onPageChange={onPageChange} />)
    const [prev] = screen.getAllByRole('button')
    await userEvent.click(prev)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('llama onPageChange con página siguiente al hacer click en "siguiente"', async () => {
    const onPageChange = jest.fn()
    render(<PaginationBar page={1} pageSize={10} total={30} onPageChange={onPageChange} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[buttons.length - 1])
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('muestra 1 página cuando total es 0', () => {
    render(<PaginationBar page={1} pageSize={10} total={0} onPageChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
  })
})
