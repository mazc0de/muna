export type StoreSeries = { id: string; name: string; color: string }

const SERIES_SLOTS = 8

/**
 * Colors follow the store, not its rank: fixed order by store name, palette
 * slots never repeat. The 9th store onward gets a neutral gray.
 */
export function assignStoreColors(stores: { id: string; name: string }[]): Map<string, StoreSeries> {
  const sorted = [...stores].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  return new Map(
    sorted.map((s, i) => [
      s.id,
      { ...s, color: i < SERIES_SLOTS ? `var(--series-${i + 1})` : 'var(--chart-axis)' },
    ]),
  )
}
