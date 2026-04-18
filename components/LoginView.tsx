'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const DEMO_EMAIL = 'demo@nubapay.com'
const DEMO_PASSWORD = 'demo123'
const AUTH_KEY = 'nubapay_auth'

export function LoginView() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true')
      router.push('/dashboard')
    } else {
      setError('Credenciales incorrectas')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Nubapay</h1>
        <p className="text-sm text-gray-500 mt-1">Panel del organizador</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="Contraseña"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}
        <Button size="lg" className="w-full mt-1">
          Ingresar
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Demo: demo@nubapay.com / demo123
      </p>
    </div>
  )
}
