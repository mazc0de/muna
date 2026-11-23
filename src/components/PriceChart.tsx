import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatDateShort, formatRupiah, parseDate } from '../lib/format'
import type { PurchaseDetail } from '../lib/queries'

import type { StoreSeries } from '../lib/storeColors'

const compactFmt = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

type Point = { t: number; date: string } & Record<string, number | boolean | string | null>

/** Line chart of unit price over time, one line per store. Promo points are hollow. */
export function PriceChart({ purchases, series }: { purchases: PurchaseDetail[]; series: Map<string, StoreSeries> }) {
  const data = useMemo(() => {
    // oldest -> newest; if a store has >1 purchase on the same date, the latest one wins
    const sorted = [...purchases].sort(
      (a, b) => a.date.localeCompare(b.date) || a.trip_created_at.localeCompare(b.trip_created_at),
    )
    const byDate = new Map<string, Point>()
    for (const p of sorted) {
      const row: Point = byDate.get(p.date) ?? { t: parseDate(p.date).getTime(), date: p.date }
      row[p.store_id] = p.unit_price
      row[`${p.store_id}:promo`] = p.is_promo
      byDate.set(p.date, row)
    }
    return [...byDate.values()]
  }, [purchases])

  const stores = [...series.values()]
  const tMin = data[0]?.t ?? 0
  const tMax = data[data.length - 1]?.t ?? 0
  const pad = tMin === tMax ? 86_400_000 * 3 : 0
  // a single distinct price makes 'auto' produce identical ticks; give it ±10% room
  const prices = purchases.map((p) => p.unit_price)
  const flat = prices.length > 0 && prices.every((v) => v === prices[0])
  const yDomain: [number | 'auto', number | 'auto'] = flat
    ? [Math.floor(prices[0] * 0.9), Math.ceil(prices[0] * 1.1)]
    : ['auto', 'auto']

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
        {stores.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
            <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Promo
        </span>
      </div>
      <div className="h-56 w-full" role="img" aria-label="Grafik Harga Satuan per Toko dari waktu ke waktu">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={[tMin - pad, tMax + pad]}
              tickFormatter={formatDateShort}
              tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              width={44}
              tickFormatter={(v: number) => compactFmt.format(v)}
              tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={yDomain}
            />
            <Tooltip
              cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as Point
                return (
                  <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900">
                    <p className="mb-1 font-semibold">{formatDate(row.date)}</p>
                    {stores
                      .filter((s) => typeof row[s.id] === 'number')
                      .map((s) => (
                        <p key={s.id} className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-stone-600 dark:text-stone-400">{s.name}</span>
                          <span className="ml-auto pl-3 font-semibold tabular-nums">
                            {formatRupiah(row[s.id] as number)}
                          </span>
                          {row[`${s.id}:promo`] === true && <span className="text-amber-600 dark:text-amber-400">promo</span>}
                        </p>
                      ))}
                  </div>
                )
              }}
            />
            {stores.map((s) => (
              <Line
                key={s.id}
                dataKey={s.id}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; payload?: Point; index?: number }) => {
                  const { cx, cy, payload, index } = props
                  if (cx == null || cy == null || !payload || typeof payload[s.id] !== 'number')
                    return <g key={`${s.id}-${index}`} />
                  const promo = payload[`${s.id}:promo`] === true
                  return (
                    <circle
                      key={`${s.id}-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      stroke={promo ? s.color : 'var(--chart-surface)'}
                      strokeWidth={promo ? 2 : 1.5}
                      fill={promo ? 'var(--chart-surface)' : s.color}
                    />
                  )
                }}
                activeDot={{ r: 6, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
