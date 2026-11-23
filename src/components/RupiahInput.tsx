import { formatNumber, parseRupiah } from '../lib/format'

type Props = {
  value: number | null
  onChange: (value: number | null) => void
  ariaLabel: string
  invalid?: boolean
  className?: string
}

/** Rupiah input: numeric keypad, auto-formatted as "20.000". */
export function RupiahInput({ value, onChange, ariaLabel, invalid, className = '' }: Props) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-stone-500">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        placeholder="0"
        value={value == null ? '' : formatNumber(value)}
        onChange={(e) => {
          const n = parseRupiah(e.target.value)
          // cap it so it stays safe as a JS Number (bigint in the DB)
          onChange(n != null && n > 999_999_999_999 ? value : n)
        }}
        className={`input pl-9 text-right tabular-nums ${invalid ? 'border-red-500 dark:border-red-500' : ''}`}
      />
    </div>
  )
}
