import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('no renderiza contenido cuando isOpen=false', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Contenido</Modal>)
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  it('renderiza contenido cuando isOpen=true', () => {
    render(<Modal isOpen onClose={() => {}}>Contenido</Modal>)
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('renderiza el título cuando se pasa', () => {
    render(<Modal isOpen onClose={() => {}} title="Mi título">X</Modal>)
    expect(screen.getByText('Mi título')).toBeInTheDocument()
  })

  it('llama onClose al hacer click en el overlay', async () => {
    const handleClose = jest.fn()
    render(<Modal isOpen onClose={handleClose}>Contenido</Modal>)
    await userEvent.click(screen.getByTestId('modal-overlay'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('llama onClose al presionar Escape', () => {
    const handleClose = jest.fn()
    render(<Modal isOpen onClose={handleClose}>Contenido</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
