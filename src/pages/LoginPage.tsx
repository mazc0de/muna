import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from '../components/Logo'
import { PasswordInput } from '../components/PasswordInput'
import { Spinner } from '../components/States'
import { supabase } from '../lib/supabase'
import { paths } from '../paths'

export function LoginPage() {
  const { session } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? paths.items
  if (session) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message === 'Failed to fetch'
            ? 'Tidak bisa terhubung ke server.'
            : error.message,
      )
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 aria-label="MuNa">
            <Logo size="lg" />
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Murah Mana?</p>
        </div>

        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? <Spinner className="border-white border-t-transparent" /> : 'Masuk'}
        </button>

        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          Belum punya akun?{' '}
          <Link to={paths.register} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Daftar
          </Link>
        </p>
      </form>
    </main>
  )
}
