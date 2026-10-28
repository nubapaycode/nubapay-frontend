import { clearWalletSession, loadWalletSession, saveWalletSession } from '@/lib/mobbexWallet'

const DAY = 24 * 60 * 60

beforeEach(() => {
  localStorage.clear()
  jest.useRealTimers()
})

describe('sesión de la billetera', () => {
  it('queda guardada en el dispositivo y sigue vigente al día siguiente', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-28T10:00:00Z'))
    saveWalletSession('tok', DAY)

    jest.setSystemTime(new Date('2026-10-29T09:00:00Z'))
    expect(loadWalletSession()).toBe('tok')
  })

  it('vence pasadas las 24 horas', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-28T10:00:00Z'))
    saveWalletSession('tok', DAY)

    jest.setSystemTime(new Date('2026-10-29T10:00:01Z'))
    expect(loadWalletSession()).toBeNull()
  })

  it('se puede borrar', () => {
    saveWalletSession('tok', DAY)
    clearWalletSession()
    expect(loadWalletSession()).toBeNull()
  })
})
