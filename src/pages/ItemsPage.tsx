import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CheapestBadge, PromoBadge, StaleBadge } from '../components/Badges'
import { IconChevron, IconSearch, IconX } from '../components/icons'
import { PageHeader } from '../components/Layout'
import { Logo } from '../components/Logo'
import { LogoutButton } from '../components/LogoutButton'
import { EmptyState, ErrorState, Loading } from '../components/States'
import { formatRelative, formatRupiah } from '../lib/format'
import { useItemOverview, type ItemOverview } from '../lib/queries'
import { paths } from '../paths'

export function ItemsPage() {
  const { data, isPending, error, refetch } = useItemOverview()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!data || !q) return data ?? []
    return data.filter((i) => i.name.toLowerCase().includes(q))
  }, [data, search])

  return (
    <>
      <PageHeader title={<Logo size="sm" />} right={<LogoutButton />} />

      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Barang…"
            aria-label="Cari Barang"
            className="input pr-10 pl-11 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>
      </div>

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada Barang">
          Catat Belanja pertamamu lewat tombol <strong>+ Belanja</strong>. Barang akan muncul di sini.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState title={`Tidak ada Barang "${search.trim()}"`} />
      ) : (
        <ul className="mx-4 mb-4 divide-y divide-stone-200 card overflow-hidden dark:divide-stone-800">
          {filtered.map((item) => (
            <ItemRow key={item.item_id} item={item} />
          ))}
        </ul>
      )}
    </>
  )
}

function ItemRow({ item }: { item: ItemOverview }) {
  const stores = item.best_store_names ?? []
  return (
    <li>
      <Link
        to={paths.item(item.item_id)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/60 dark:active:bg-stone-800"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}</p>
          {stores.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              {item.has_comparison && <CheapestBadge />}
              <span className="min-w-0 truncate">{stores.join(', ')}</span>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-stone-500">Belum ada Pembelian</p>
          )}
        </div>
        {item.best_price != null && (
          <div className="shrink-0 text-right">
            <p className="font-semibold tabular-nums">{formatRupiah(item.best_price)}</p>
            <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-stone-500 dark:text-stone-400">
              {item.best_is_promo && <PromoBadge />}
              {item.best_is_stale && <StaleBadge />}
              {item.best_date && <span>{formatRelative(item.best_date)}</span>}
            </div>
          </div>
        )}
        <IconChevron className="size-4 shrink-0 text-stone-400" />
      </Link>
    </li>
  )
}
