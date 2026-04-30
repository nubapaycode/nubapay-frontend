'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { authPaths } from '@/lib/api'
import { type AuthUser, setAuthSession } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { FetchError } from '@/lib/fetcher'

const inputClass = "w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"

type Mode = 'login' | 'register'

export function LoginView() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const finishAuth = (token: string, user: AuthUser) => {
    setAuthSession(token, user)
    router.push('/events')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.login(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = (await res.json()) as {
        token?: string
        user?: AuthUser
        error?: string
      }
      if (res.ok && body.token && body.user) {
        finishAuth(body.token, body.user)
        return
      }
      setError(body.error ?? 'Credenciales incorrectas')
    } catch (err) {
      if (err instanceof FetchError) {
        setError(err.message)
      } else {
        setError('No se pudo contactar al servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) {
      setError('Ingresá tu nombre (mínimo 2 caracteres)')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.register(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      })
      const body = (await res.json()) as {
        token?: string
        user?: AuthUser
        error?: string
      }
      if (res.ok && body.token && body.user) {
        finishAuth(body.token, body.user)
        return
      }
      setError(body.error ?? 'No se pudo crear la cuenta')
    } catch (err) {
      if (err instanceof FetchError) {
        setError(err.message)
      } else {
        setError('No se pudo contactar al servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
  }

  return (
    <div className="w-full max-w-sm">

      <div className="mb-8 text-center">
        <div className="inline-flex items-baseline">
          <span className="text-xl font-medium text-gray-900 tracking-tight">nubapay</span>
          <span className="ml-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">organizer</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-5">
          <h1 className="text-lg font-medium text-gray-900">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login'
              ? 'Accedé al panel del organizador'
              : 'Registrate y empezá a crear eventos'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Contraseña"
              autoComplete="current-password"
              className={inputClass}
              disabled={loading}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Nombre completo"
              autoComplete="name"
              className={inputClass}
              disabled={loading}
            />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Contraseña (mín. 8 caracteres)"
              autoComplete="new-password"
              className={inputClass}
              disabled={loading}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-5 border-t border-gray-100 text-center">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              ¿No tenés cuenta? <span className="font-medium text-gray-900">Registrate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              ¿Ya tenés cuenta? <span className="font-medium text-gray-900">Iniciá sesión</span>
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
