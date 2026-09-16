import { act, render, screen } from '@testing-library/react'

import { ConnectionApprovedOverlay } from '@/components/organizer/ConnectionApprovedOverlay'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('ConnectionApprovedOverlay', () => {
  it('muestra el mensaje de aprobado y avisa al terminar la animación', () => {
    const onDone = jest.fn()
    render(
      <ConnectionApprovedOverlay
        title="¡Cuenta conectada!"
        subtitle="Volviendo a Métodos de pago…"
        onDone={onDone}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('¡Cuenta conectada!')
    expect(screen.getByRole('status')).toHaveTextContent('Volviendo a Métodos de pago…')
    expect(onDone).not.toHaveBeenCalled()

    act(() => { jest.advanceTimersByTime(2200) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('no avisa si se desmonta antes de terminar', () => {
    const onDone = jest.fn()
    const { unmount } = render(<ConnectionApprovedOverlay title="¡Cuenta conectada!" onDone={onDone} />)

    unmount()
    act(() => { jest.advanceTimersByTime(5000) })
    expect(onDone).not.toHaveBeenCalled()
  })
})
