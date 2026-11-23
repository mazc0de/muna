import type { ReactNode } from 'react'
import { errorMessage } from '../lib/queries'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Memuat"
      className={`inline-block size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent ${className}`}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="size-7" />
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-4 my-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
      <p className="font-medium">Gagal memuat data</p>
      <p className="mt-1">{errorMessage(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 font-semibold underline underline-offset-2">
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-base font-semibold text-stone-700 dark:text-stone-200">{title}</p>
      {children && <div className="mt-2 text-sm text-stone-500 dark:text-stone-400">{children}</div>}
    </div>
  )
}
