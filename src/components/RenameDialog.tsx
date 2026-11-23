import { useState } from 'react'
import { errorMessage } from '../lib/queries'
import { Spinner } from './States'

type Props = {
  title: string
  description?: string
  initial: string
  onSubmit: (name: string) => Promise<unknown>
  onClose: () => void
}

/** Simple dialog for renaming an item or a store. */
export function RenameDialog({ title, description, initial, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Nama tidak boleh kosong.')
    if (trimmed === initial) return onClose()
    setBusy(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-sm p-4" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            } else if (e.key === 'Escape') onClose()
          }}
          className="input mt-3"
          aria-label="Nama"
        />
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn-primary flex-1" disabled={busy} onClick={submit}>
            {busy ? <Spinner className="border-white border-t-transparent" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
