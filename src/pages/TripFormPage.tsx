import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Combobox, type Choice } from '../components/Combobox'
import { IconPencil, IconPlus, IconTrash, IconX } from '../components/icons'
import { PageHeader } from '../components/Layout'
import { RenameDialog } from '../components/RenameDialog'
import { RupiahInput } from '../components/RupiahInput'
import { EmptyState, ErrorState, Loading, Spinner } from '../components/States'
import { formatRupiah, todayISO } from '../lib/format'
import {
  errorMessage,
  useDeleteTrip,
  useItemNames,
  useRenameStore,
  useSaveTrip,
  useStoreNames,
  useTrip,
  type PurchaseDetail,
} from '../lib/queries'
import { paths } from '../paths'

type Row = {
  key: number
  item: Choice
  qty: number | null
  price: number | null
  promo: boolean
}

type Initial = { tripId: string | null; store: Choice; date: string; rows: Row[] }

let nextKey = 1
const emptyRow = (): Row => ({ key: nextKey++, item: { id: null, name: '' }, qty: 1, price: null, promo: false })

const toRow = (p: PurchaseDetail): Row => ({
  key: nextKey++,
  item: { id: p.item_id, name: p.item_name },
  qty: p.qty,
  price: p.unit_price,
  promo: p.is_promo,
})

/** `/trips/new` and `/trips/:id` share the same form. */
export function TripFormPage() {
  const { id } = useParams()
  const trip = useTrip(id)

  if (!id) {
    return (
      <TripForm
        initial={{ tripId: null, store: { id: null, name: '' }, date: todayISO(), rows: [emptyRow()] }}
      />
    )
  }

  if (trip.isPending)
    return (
      <>
        <PageHeader title="Belanja" back={paths.trips} />
        <Loading />
      </>
    )
  if (trip.error)
    return (
      <>
        <PageHeader title="Belanja" back={paths.trips} />
        <ErrorState error={trip.error} onRetry={() => trip.refetch()} />
      </>
    )
  if (!trip.data)
    return (
      <>
        <PageHeader title="Belanja" back={paths.trips} />
        <EmptyState title="Belanja tidak ditemukan">Mungkin sudah dihapus.</EmptyState>
      </>
    )

  const t = trip.data
  return (
    <TripForm
      key={t.id}
      initial={{
        tripId: t.id,
        store: { id: t.store_id, name: t.stores?.name ?? '' },
        date: t.date,
        rows: t.purchases.length ? t.purchases.map(toRow) : [emptyRow()],
      }}
    />
  )
}

type Errors = { store?: string; rows: Record<number, string>; form?: string }

function TripForm({ initial }: { initial: Initial }) {
  const navigate = useNavigate()
  const isEdit = initial.tripId !== null
  const stores = useStoreNames()
  const items = useItemNames()
  const save = useSaveTrip()

  const [store, setStore] = useState<Choice>(initial.store)
  const [date, setDate] = useState(initial.date)
  const [rows, setRows] = useState<Row[]>(initial.rows)
  const [errors, setErrors] = useState<Errors>({ rows: {} })
  const [focusKey, setFocusKey] = useState<number | null>(null)

  const total = rows.reduce((sum, r) => sum + (r.qty ?? 0) * (r.price ?? 0), 0)

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    setErrors((e) => {
      if (!e.rows[key]) return e
      const rest = { ...e.rows }
      delete rest[key]
      return { ...e, rows: rest }
    })
  }

  function addRow() {
    const row = emptyRow()
    setRows((rs) => [...rs, row])
    setFocusKey(row.key)
  }

  function removeRow(key: number) {
    setRows((rs) => (rs.length === 1 ? [emptyRow()] : rs.filter((r) => r.key !== key)))
  }

  function validate(): { ok: boolean; filled: Row[] } {
    const next: Errors = { rows: {} }
    if (!store.name.trim()) next.store = 'Pilih atau tambah Toko.'

    // fully empty rows are ignored
    const filled = rows.filter((r) => r.item.name.trim() !== '' || r.price != null)
    const seen = new Map<string, number>()
    for (const r of filled) {
      const name = r.item.name.trim()
      if (!name) next.rows[r.key] = 'Pilih atau tambah Barang.'
      else if (r.price == null) next.rows[r.key] = 'Isi Harga Satuan.'
      else if (!r.qty || r.qty < 1) next.rows[r.key] = 'Qty minimal 1.'
      const id = r.item.id ?? `new:${name.toLowerCase()}`
      if (name && seen.has(id)) {
        next.rows[r.key] = `“${name}” sudah ada di Belanja ini. Ubah qty-nya saja.`
      }
      seen.set(id, r.key)
    }
    if (filled.length === 0) next.form = 'Tambahkan minimal satu Barang.'

    setErrors(next)
    return { ok: !next.store && !next.form && Object.keys(next.rows).length === 0, filled }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const { ok, filled } = validate()
    if (!ok) return
    try {
      await save.mutateAsync({
        tripId: initial.tripId,
        storeId: store.id,
        storeName: store.name.trim(),
        date,
        purchases: filled.map((r) => ({
          item_id: r.item.id,
          item_name: r.item.name.trim(),
          qty: r.qty ?? 1,
          unit_price: r.price ?? 0,
          is_promo: r.promo,
        })),
      })
      navigate(paths.trips, { replace: true })
    } catch (err) {
      setErrors({ rows: {}, form: errorMessage(err) })
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="pb-28">
      <PageHeader title={isEdit ? 'Ubah Belanja' : 'Belanja Baru'} back={paths.trips} />

      <div className="space-y-4 p-4">
        <section className="card space-y-4 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Toko</label>
              {store.id && <RenameStore store={{ id: store.id, name: store.name }} onRenamed={setStore} />}
            </div>
            <Combobox
              ariaLabel="Toko"
              placeholder="mis. Indomaret Jl. Merdeka"
              options={stores.data ?? []}
              value={store}
              onChange={(v) => {
                setStore(v)
                setErrors((e) => ({ ...e, store: undefined }))
              }}
              invalid={!!errors.store}
              autoFocus={!isEdit}
            />
            {errors.store && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.store}</p>}
          </div>
          <div>
            <label htmlFor="trip-date" className="mb-1 block text-sm font-medium">
              Tanggal
            </label>
            <input
              id="trip-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="input"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 uppercase dark:text-stone-400">
            Barang ({rows.filter((r) => r.item.name.trim()).length})
          </h2>
          <ul className="space-y-3">
            {rows.map((row, idx) => (
              <li key={row.key} className="card p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Combobox
                      ariaLabel={`Barang ${idx + 1}`}
                      placeholder="Barang, mis. Telur 1 kg"
                      options={items.data ?? []}
                      value={row.item}
                      onChange={(v) => updateRow(row.key, { item: v })}
                      invalid={!!errors.rows[row.key]}
                      autoFocus={focusKey === row.key}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus baris ${idx + 1}`}
                    onClick={() => removeRow(row.key)}
                    className="mt-1 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800"
                  >
                    <IconX />
                  </button>
                </div>

                <div className="mt-2 flex items-end gap-2">
                  <div className="w-20 shrink-0">
                    <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">Qty</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`Qty ${idx + 1}`}
                      value={row.qty ?? ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        updateRow(row.key, { qty: Number.isNaN(n) ? null : Math.max(0, Math.min(n, 9999)) })
                      }}
                      onFocus={(e) => e.target.select()}
                      className="input text-center tabular-nums"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs text-stone-500 dark:text-stone-400">Harga Satuan</label>
                    <RupiahInput
                      ariaLabel={`Harga Satuan ${idx + 1}`}
                      value={row.price}
                      onChange={(v) => updateRow(row.key, { price: v })}
                      invalid={errors.rows[row.key] === 'Isi Harga Satuan.'}
                    />
                  </div>
                  <label
                    className={`flex h-[46px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium select-none ${
                      row.promo
                        ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={row.promo}
                      onChange={(e) => updateRow(row.key, { promo: e.target.checked })}
                      className="size-4 accent-amber-500"
                    />
                    Promo
                  </label>
                </div>

                {errors.rows[row.key] ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.rows[row.key]}</p>
                ) : (
                  row.qty != null &&
                  row.qty > 1 &&
                  row.price != null && (
                    <p className="mt-2 text-right text-sm text-stone-500 dark:text-stone-400">
                      {row.qty} × {formatRupiah(row.price)} = {formatRupiah(row.qty * row.price)}
                    </p>
                  )
                )}
              </li>
            ))}
          </ul>

          <button type="button" onClick={addRow} className="btn-secondary mt-3 w-full">
            <IconPlus className="size-5" />
            Tambah Barang
          </button>
        </section>

        {isEdit && <DeleteTrip tripId={initial.tripId!} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {errors.form && (
            <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
              {errors.form}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
              <p className="truncate text-lg font-bold tabular-nums">{formatRupiah(total)}</p>
            </div>
            <button type="submit" disabled={save.isPending} className="btn-primary min-w-32">
              {save.isPending ? <Spinner className="border-white border-t-transparent" /> : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

function RenameStore({ store, onRenamed }: { store: { id: string; name: string }; onRenamed: (c: Choice) => void }) {
  const rename = useRenameStore()
  const [editing, setEditing] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        <IconPencil className="size-3.5" />
        Ubah nama Toko
      </button>
      {editing && (
        <RenameDialog
          title="Ubah nama Toko"
          description="Berlaku untuk semua Belanja di Toko ini."
          initial={store.name}
          onSubmit={async (name) => {
            await rename.mutateAsync({ id: store.id, name })
            onRenamed({ id: store.id, name })
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}

function DeleteTrip({ tripId }: { tripId: string }) {
  const navigate = useNavigate()
  const del = useDeleteTrip()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)

  // the confirmation box can sit behind the bottom Save bar, so scroll it to the center
  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [confirming])

  async function onDelete() {
    try {
      await del.mutateAsync(tripId)
      navigate(paths.trips, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <section className="pt-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <IconTrash />
          Hapus Belanja
        </button>
      ) : (
        <div ref={confirmRef} className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="font-semibold text-red-800 dark:text-red-200">Hapus Belanja ini?</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Semua Pembelian di dalamnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.
          </p>
          {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setConfirming(false)}>
              Batal
            </button>
            <button type="button" className="btn-danger flex-1" disabled={del.isPending} onClick={onDelete}>
              {del.isPending ? <Spinner className="border-white border-t-transparent" /> : 'Hapus'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
