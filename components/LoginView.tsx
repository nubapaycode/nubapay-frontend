'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_EMAIL = 'demo@nubapay.com'
const DEMO_PASSWORD = 'demo123'
const AUTH_KEY = 'nubapay_auth'

const inputClass = "w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"

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

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div className="w-full max-w-sm">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-baseline">
          <span className="text-xl font-medium text-gray-900 tracking-tight">nubapay</span>
          <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">organizer</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-5">
          <h1 className="text-lg font-medium text-gray-900">Iniciar sesión</h1>
          <p className="text-sm text-gray-400 mt-1">Accedé al panel del organizador</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Contraseña"
            className={inputClass}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors mt-2"
          >
            Ingresar
          </button>
        </form>
      </div>

      {/* Demo hint */}
      <button
        onClick={fillDemo}
        type="button"
        className="w-full text-center text-xs text-gray-400 mt-6 hover:text-gray-600 transition-colors"
      >
        Usar credenciales demo · demo@nubapay.com / demo123
      </button>

    </div>
  )
}
