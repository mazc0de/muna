import { Link } from 'react-router'
import { IconChevron } from '../components/icons'
import { PageHeader } from '../components/Layout'
import { LogoutButton } from '../components/LogoutButton'
import { EmptyState, ErrorState, Loading } from '../components/States'
import { formatDate, formatRupiah } from '../lib/format'
import { useTripOverview } from '../lib/queries'
import { paths } from '../paths'

export function TripsPage() {
  const { data, isPending, error, refetch } = useTripOverview()

  return (
    <>
      <PageHeader title="Belanja" right={<LogoutButton />} />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada Belanja">
          Tekan <strong>+ Belanja</strong> untuk mencatat belanjaan pertamamu.
        </EmptyState>
      ) : (
        <ul className="m-4 divide-y divide-stone-200 card overflow-hidden dark:divide-stone-800">
          {data.map((trip) => (
            <li key={trip.id}>
              <Link
                to={paths.trip(trip.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/60 dark:active:bg-stone-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{trip.store_name}</p>
                  <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                    {formatDate(trip.date)} · {trip.item_count ?? 0} Barang
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatRupiah(trip.total ?? 0)}</p>
                <IconChevron className="size-4 shrink-0 text-stone-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
