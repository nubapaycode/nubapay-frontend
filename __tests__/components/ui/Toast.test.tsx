import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToast } from '@/components/ui/Toast'

function ToastHarness({ type = 'info' as const, message = 'Mensaje de prueba' }) {
  const { show, ToastPortal } = useToast(99999)
  return (
    <>
      <button onClick={() => show(message, type)}>Mostrar</button>
      <ToastPortal />
    </>
  )
}

describe('Toast', () => {
  it('no muestra ningún toast inicialmente', () => {
    render(<ToastHarness />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el toast al llamar show()', async () => {
    render(<ToastHarness message="Operación exitosa" type="success" />)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument()
  })

  it('muestra toast de error', async () => {
    render(<ToastHarness message="Algo falló" type="error" />)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Algo falló')).toBeInTheDocument()
  })

  it('cierra el toast al hacer click en "Cerrar"', async () => {
    render(<ToastHarness message="Test" />)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('puede mostrar múltiples toasts', async () => {
    render(<ToastHarness message="Toast 1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThanOrEqual(2)
  })
})
