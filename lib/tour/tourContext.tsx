'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { authHeadersJson, getAuthUser, setAuthSession, getAuthToken } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { authPaths } from '@/lib/api/paths'
import { TOUR_TOTAL } from './tourSteps'

const STEP_KEY = 'nubapay_tour_step'
const DONE_KEY = 'nubapay_tour_done'

type TourCtx = {
  step: number
  active: boolean
  advance: () => void
  jumpTo: (index: number) => void
  skip: () => void
}

const Ctx = createContext<TourCtx>({ step: 0, active: false, advance: () => {}, jumpTo: () => {}, skip: () => {} })

async function markDone() {
  try {
    const res = await browserFetch(authPaths.completeOnboarding(), {
      method: 'POST',
      headers: authHeadersJson(),
    })
    const body = (await res.json()) as { user?: { onboarding_completed?: boolean } }
    const token = getAuthToken()
    const user = getAuthUser()
    if (token && user && body.user) {
      setAuthSession(token, { ...user, onboarding_completed: true })
    }
  } catch {
    // ignore — flag set locally anyway
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const done =
      localStorage.getItem(DONE_KEY) === '1' || getAuthUser()?.onboarding_completed === true
    if (done) {
      setReady(true)
      return
    }
    const saved = parseInt(localStorage.getItem(STEP_KEY) ?? '0', 10)
    setStep(Number.isFinite(saved) ? saved : 0)
    setActive(true)
    setReady(true)
  }, [])

  const finish = useCallback(() => {
    localStorage.setItem(DONE_KEY, '1')
    localStorage.removeItem(STEP_KEY)
    setActive(false)
    void markDone()
  }, [])

  const advance = useCallback(() => {
    setStep(prev => {
      const next = prev + 1
      if (next >= TOUR_TOTAL) {
        localStorage.setItem(DONE_KEY, '1')
        localStorage.removeItem(STEP_KEY)
        setActive(false)
        void markDone()
        return prev
      }
      localStorage.setItem(STEP_KEY, String(next))
      return next
    })
  }, [])

  const jumpTo = useCallback((index: number) => {
    if (index >= TOUR_TOTAL) {
      finish()
      return
    }
    localStorage.setItem(STEP_KEY, String(index))
    setStep(index)
  }, [finish])

  const skip = useCallback(() => finish(), [finish])

  if (!ready) return <>{children}</>

  return <Ctx.Provider value={{ step, active, advance, jumpTo, skip }}>{children}</Ctx.Provider>
}

export function useTour() {
  return useContext(Ctx)
}
