// Display formatting: whole Rupiah amounts and Indonesian dates.

const numberFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/** 20000 -> "20.000" */
export function formatNumber(n: number): string {
  return numberFmt.format(n)
}

/** 20000 -> "Rp20.000" */
export function formatRupiah(n: number): string {
  return `Rp${formatNumber(n)}`
}

/** Difference from the cheapest: 2000 -> "+Rp2.000" */
export function formatDiff(n: number): string {
  return `+${formatRupiah(n)}`
}

/** "20.000" / "20000" / "Rp 20.000" -> 20000; empty -> null */
export function parseRupiah(text: string): number | null {
  const digits = text.replace(/\D/g, '')
  if (digits === '') return null
  return Number(digits)
}

/** A DB `date` column ("YYYY-MM-DD") parsed as a local date, not UTC. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Today (local time) as "YYYY-MM-DD". */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const dateFmtShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

/** "2026-11-23" -> "23 Nov 2026" */
export function formatDate(iso: string): string {
  return dateFmt.format(parseDate(iso))
}

/** For chart axes: "23 Nov" */
export function formatDateShort(ms: number): string {
  return dateFmtShort.format(new Date(ms))
}

const weekdayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-11-23" -> "Senin, 23 November 2026" */
export function formatDateLong(iso: string): string {
  return weekdayFmt.format(parseDate(iso))
}

/** Days from the given (local) date until today. */
export function daysAgo(iso: string): number {
  const today = parseDate(todayISO()).getTime()
  return Math.round((today - parseDate(iso).getTime()) / 86_400_000)
}

/** "hari ini", "kemarin", "5 hari lalu", "3 bln lalu", "1 thn lalu" */
export function formatRelative(iso: string): string {
  const d = daysAgo(iso)
  if (d <= 0) return 'hari ini'
  if (d === 1) return 'kemarin'
  if (d < 30) return `${d} hari lalu`
  if (d < 365) return `${Math.floor(d / 30)} bln lalu`
  return `${Math.floor(d / 365)} thn lalu`
}
