import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from '../components/Logo'
import { PasswordInput } from '../components/PasswordInput'
import { Spinner } from '../components/States'
import { supabase } from '../lib/supabase'
import { paths } from '../paths'

const MIN_PASSWORD = 6 // matches the Supabase default (Authentication → Policies)

function signUpError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered')) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'Pendaftaran sedang ditutup. Hubungi pemilik aplikasi.'
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  if (m.includes('password')) return 'Password terlalu lemah. Gunakan kombinasi yang lebih panjang.'
  if (m.includes('invalid') && m.includes('email')) return 'Format email tidak valid.'
  if (message === 'Failed to fetch') return 'Tidak bisa terhubung ke server.'
  return message
}

export function RegisterPage() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // set when Supabase requires email confirmation
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  if (session) return <Navigate to={paths.items} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) return setError(`Password minimal ${MIN_PASSWORD} karakter.`)
    if (password !== confirm) return setError('Konfirmasi password tidak sama.')

    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}${paths.items}` },
    })
    setBusy(false)

    if (error) return setError(signUpError(error.message))
    // Supabase doesn't error on an already-registered email (anti-enumeration),
    // but returns a user with no identities.
    if (data.user && data.user.identities?.length === 0)
      return setError('Email ini sudah terdaftar. Silakan masuk.')
    // With email confirmation off we get a session right away and get redirected below.
    if (!data.session) setPendingEmail(email.trim())
  }

  if (pendingEmail) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 aria-label="MuNa">
            <Logo size="lg" />
          </h1>
          <h1 className="mt-6 text-lg font-bold">Cek email kamu</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Kami mengirim link konfirmasi ke <strong className="text-stone-900 dark:text-stone-100">{pendingEmail}</strong>.
            Buka link itu untuk mengaktifkan akun, lalu kamu akan otomatis masuk.
          </p>
          <Link to={paths.login} className="btn-secondary mt-6 w-full">
            Kembali ke halaman masuk
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 aria-label="MuNa">
            <Logo size="lg" />
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Buat akun baru</p>
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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Minimal {MIN_PASSWORD} karakter.</p>

        <label className="mt-4 block text-sm font-medium" htmlFor="confirm">
          Ulangi password
        </label>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1"
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? <Spinner className="border-white border-t-transparent" /> : 'Daftar'}
        </button>

        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          Sudah punya akun?{' '}
          <Link to={paths.login} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Masuk
          </Link>
        </p>
      </form>
    </main>
  )
}
