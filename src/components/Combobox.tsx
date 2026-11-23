import { useId, useMemo, useRef, useState } from 'react'
import type { Named } from '../lib/queries'
import { IconPlus } from './icons'

/** A choice: an existing store/item (id) or a new name (id = null). */
export type Choice = { id: string | null; name: string }

type Props = {
  options: Named[]
  value: Choice
  onChange: (value: Choice) => void
  placeholder?: string
  ariaLabel: string
  invalid?: boolean
  autoFocus?: boolean
}

const MAX_SUGGESTIONS = 8

/**
 * Autocomplete with a "+ Tambah 'X'" (add new) option. Typed names are matched
 * case-insensitively, so "telur 1 kg" automatically picks the existing
 * item "Telur 1 kg".
 */
export function Combobox({ options, value, onChange, placeholder, ariaLabel, invalid, autoFocus }: Props) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const text = value.name
  const query = text.trim().toLowerCase()
  const exact = options.find((o) => o.name.toLowerCase() === query)

  const suggestions = useMemo(() => {
    if (!query) return options.slice(0, MAX_SUGGESTIONS)
    const starts = options.filter((o) => o.name.toLowerCase().startsWith(query))
    const contains = options.filter(
      (o) => !o.name.toLowerCase().startsWith(query) && o.name.toLowerCase().includes(query),
    )
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [options, query])

  const canCreate = query !== '' && !exact
  const entries: Array<{ kind: 'option'; option: Named } | { kind: 'create' }> = [
    ...suggestions.map((option) => ({ kind: 'option' as const, option })),
    ...(canCreate ? [{ kind: 'create' as const }] : []),
  ]
  const showList = open && entries.length > 0 && !(exact && value.id === exact.id && suggestions.length === 1)

  function choose(i: number) {
    const entry = entries[i]
    if (!entry) return
    if (entry.kind === 'option') onChange({ id: entry.option.id, name: entry.option.name })
    else onChange({ id: null, name: text.trim() })
    setOpen(false)
  }

  function onType(next: string) {
    const match = options.find((o) => o.name.toLowerCase() === next.trim().toLowerCase())
    onChange({ id: match?.id ?? null, name: next })
    setOpen(true)
    setActive(0)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        autoComplete="off"
        autoCapitalize="sentences"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={text}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          // trim whitespace and snap to the existing name's casing
          if (exact) onChange({ id: exact.id, name: exact.name })
          else if (text !== text.trim()) onChange({ id: null, name: text.trim() })
        }}
        onKeyDown={(e) => {
          if (!showList) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => (a + 1) % entries.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => (a - 1 + entries.length) % entries.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            choose(active)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        className={`input ${value.id === null && query ? 'pr-16' : ''} ${invalid ? 'border-red-500 dark:border-red-500' : ''}`}
      />
      {value.id === null && query !== '' && !open && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
          baru
        </span>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {entries.map((entry, i) => (
            <li
              key={entry.kind === 'option' ? entry.option.id : '__create'}
              role="option"
              aria-selected={i === active}
              // mousedown: select before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault()
                choose(i)
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3.5 py-2.5 ${
                i === active ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
              }`}
            >
              {entry.kind === 'option' ? (
                <span className="truncate">{entry.option.name}</span>
              ) : (
                <>
                  <IconPlus className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <span className="truncate font-medium text-emerald-800 dark:text-emerald-300">
                    Tambah “{text.trim()}”
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
