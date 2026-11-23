import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CheapestBadge, PromoBadge, StaleBadge } from '../components/Badges'
import { IconPencil, IconTrash } from '../components/icons'
import { PageHeader } from '../components/Layout'
import { PriceChart } from '../components/PriceChart'
import { RenameDialog } from '../components/RenameDialog'
import { EmptyState, ErrorState, Loading } from '../components/States'
import { formatDate, formatDiff, formatRelative, formatRupiah } from '../lib/format'
import {
  errorMessage,
  useDeleteItem,
  useItem,
  useItemPurchases,
  useItemStoreSummary,
  useRenameItem,
  type ItemStoreSummary,
} from '../lib/queries'
import { paths } from '../paths'
import { assignStoreColors, type StoreSeries } from '../lib/storeColors'

export function ItemDetailPage() {
  const { id = '' } = useParams()
  const item = useItem(id)
  const summary = useItemStoreSummary(id)
  const purchases = useItemPurchases(id)
  const [renaming, setRenaming] = useState(false)
  const rename = useRenameItem()

  const series = useMemo(
    () => assignStoreColors((summary.data ?? []).map((s) => ({ id: s.store_id, name: s.store_name }))),
    [summary.data],
  )

  const pending = item.isPending || summary.isPending || purchases.isPending
  const error = item.error || summary.error || purchases.error

  if (pending || error || !item.data) {
    return (
      <>
        <PageHeader title="Barang" back={paths.items} />
        {pending ? (
          <Loading />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              item.refetch()
              summary.refetch()
              purchases.refetch()
            }}
          />
        ) : (
          <EmptyState title="Barang tidak ditemukan" />
        )}
      </>
    )
  }

  const stores = sortCards(summary.data ?? [])
  const history = purchases.data ?? []
  const hasComparison = stores.some((s) => (s.stores_with_reference ?? 0) >= 2)

  return (
    <>
      <PageHeader
        title={item.data.name}
        back={paths.items}
        right={
          <button
            type="button"
            onClick={() => setRenaming(true)}
            aria-label="Ubah nama Barang"
            className="rounded-full p-2.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <IconPencil className="size-5" />
          </button>
        }
      />
      {renaming && (
        <RenameDialog
          title="Ubah nama Barang"
          description="Ingat: ukuran/varian adalah bagian dari nama, mis. “Telur 1 kg”."
          initial={item.data.name}
          onSubmit={(name) => rename.mutateAsync({ id, name })}
          onClose={() => setRenaming(false)}
        />
      )}

      <div className="space-y-6 p-4">
        {history.length === 0 ? (
          <>
            <EmptyState title="Belum ada Pembelian">Barang ini belum pernah dicatat di Belanja mana pun.</EmptyState>
            <DeleteItem id={id} />
          </>
        ) : (
          <>
            <section aria-labelledby="per-toko">
              <h2 id="per-toko" className="mb-2 px-1 text-sm font-semibold text-stone-500 uppercase dark:text-stone-400">
                Harga per Toko
              </h2>
              {!hasComparison && (
                <p className="mb-2 px-1 text-sm text-stone-500 dark:text-stone-400">Belum ada pembanding dari Toko lain.</p>
              )}
              <ul className="space-y-2">
                {stores.map((s) => (
                  <StoreCard key={s.store_id} s={s} color={series.get(s.store_id)} />
                ))}
              </ul>
            </section>

            <section aria-labelledby="grafik" className="card p-4">
              <h2 id="grafik" className="mb-2 text-sm font-semibold text-stone-500 uppercase dark:text-stone-400">
                Harga Satuan dari waktu ke waktu
              </h2>
              <PriceChart purchases={history} series={series} />
            </section>

            <section aria-labelledby="riwayat">
              <h2 id="riwayat" className="mb-2 px-1 text-sm font-semibold text-stone-500 uppercase dark:text-stone-400">
                Riwayat Pembelian
              </h2>
              <ul className="card divide-y divide-stone-200 overflow-hidden dark:divide-stone-800">
                {history.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={paths.trip(p.trip_id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: series.get(p.store_id)?.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.store_name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {formatDate(p.date)} · qty {p.qty}
                        </p>
                      </div>
                      {p.is_promo && <PromoBadge />}
                      <p className="shrink-0 font-semibold tabular-nums">{formatRupiah(p.unit_price)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </>
  )
}

/** Stores with a reference price (cheapest first), then promo-only stores. */
function sortCards(rows: ItemStoreSummary[]): ItemStoreSummary[] {
  return [...rows].sort((a, b) => {
    if (a.reference_price != null && b.reference_price != null)
      return a.reference_price - b.reference_price || a.store_name.localeCompare(b.store_name, 'id')
    if (a.reference_price != null) return -1
    if (b.reference_price != null) return 1
    return a.store_name.localeCompare(b.store_name, 'id')
  })
}

function StoreCard({ s, color }: { s: ItemStoreSummary; color?: StoreSeries }) {
  const hasReference = s.reference_price != null
  // Promo info only matters if it's newer than the reference price (or there is none)
  const showPromo =
    s.last_promo_price != null &&
    s.last_promo_date != null &&
    (!hasReference || s.last_promo_date >= (s.reference_date ?? ''))

  return (
    <li
      className={`card p-4 ${s.is_cheapest ? 'border-emerald-400 ring-1 ring-emerald-400 dark:border-emerald-700 dark:ring-emerald-700' : ''} ${
        s.is_stale ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: color?.color }} aria-hidden />
        <p className="min-w-0 flex-1 truncate font-semibold">{s.store_name}</p>
        {s.is_stale && <StaleBadge />}
        {s.is_cheapest && <CheapestBadge />}
      </div>

      {hasReference ? (
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums">{formatRupiah(s.reference_price!)}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {formatDate(s.reference_date!)} · {formatRelative(s.reference_date!)}
            </p>
          </div>
          {s.diff_from_cheapest != null && s.diff_from_cheapest > 0 && (
            <p className="text-sm font-semibold text-red-600 tabular-nums dark:text-red-400">
              {formatDiff(s.diff_from_cheapest)}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Belum ada harga normal</p>
      )}

      {showPromo && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          promo terakhir <span className="font-semibold tabular-nums">{formatRupiah(s.last_promo_price!)}</span>
          <span className="text-stone-500 dark:text-stone-400"> · {formatDate(s.last_promo_date!)}</span>
        </p>
      )}
    </li>
  )
}

function DeleteItem({ id }: { id: string }) {
  const del = useDeleteItem()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="text-center">
      <button
        type="button"
        disabled={del.isPending}
        onClick={async () => {
          try {
            await del.mutateAsync(id)
            navigate(paths.items, { replace: true })
          } catch (err) {
            setError(errorMessage(err))
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <IconTrash />
        Hapus Barang
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
