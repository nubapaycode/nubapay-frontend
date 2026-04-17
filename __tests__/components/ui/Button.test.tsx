import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renderiza el texto del botón', () => {
    render(<Button>Pagar</Button>)
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
  })

  it('llama onClick al hacer click', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Pagar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('está deshabilitado cuando disabled=true', () => {
    render(<Button disabled>Pagar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('está deshabilitado y muestra spinner cuando loading=true', () => {
    render(<Button loading>Pagar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('no llama onClick cuando está deshabilitado', async () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Pagar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
