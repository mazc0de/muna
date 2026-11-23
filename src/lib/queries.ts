// Data access: the single place for every Supabase query and mutation.
// Comparison logic (reference price, cheapest store, stale data) lives in the
// database views; this module only reads their results.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from './database.types'
import { supabase } from './supabase'

type Views = Database['public']['Views']
export type ItemOverview = Views['item_overview']['Row']
export type ItemStoreSummary = Views['item_store_summary']['Row']
export type PurchaseDetail = Views['purchase_details']['Row']
export type TripOverview = Views['trip_overview']['Row']
export type Named = { id: string; name: string }

/** Postgres/PostgREST error -> user-facing message (UI copy is Indonesian). */
export function errorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null
  if (!e) return 'Terjadi kesalahan.'
  if (e.code === '23505') {
    if (e.message?.includes('stores_user_name_key')) return 'Nama Toko itu sudah dipakai.'
    if (e.message?.includes('items_user_name_key')) return 'Nama Barang itu sudah dipakai.'
    if (e.message?.includes('purchases_trip_id_item_id_key') || e.message?.includes('twice'))
      return 'Barang yang sama tidak boleh muncul dua kali dalam satu Belanja.'
    return 'Data itu sudah ada.'
  }
  if (e.code === '23503') return 'Masih dipakai oleh data lain, jadi tidak bisa dihapus.'
  // messages raised by save_trip (see migration)
  if (e.code === 'P0001') {
    if (e.message?.includes('at least one purchase')) return 'Tambahkan minimal satu Barang.'
    if (e.message?.includes('store is required')) return 'Pilih atau tambah Toko.'
    if (e.message?.includes('item is required')) return 'Pilih atau tambah Barang.'
  }
  if (e.code === 'P0002') return 'Belanja tidak ditemukan. Mungkin sudah dihapus.'
  if (e.message === 'Failed to fetch') return 'Tidak bisa terhubung ke server. Cek koneksi internet.'
  return e.message ?? 'Terjadi kesalahan.'
}

async function run<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> {
  const { data, error } = await p
  if (error) throw error
  return data as NonNullable<T>
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export function useItemOverview() {
  return useQuery({
    queryKey: ['item_overview'],
    queryFn: () =>
      run(
        supabase
          .from('item_overview')
          .select('*')
          .order('last_purchased_at', { ascending: false, nullsFirst: false })
          .order('last_trip_created_at', { ascending: false, nullsFirst: false })
          .order('name'),
      ),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => run(supabase.from('items').select('id, name').eq('id', id).maybeSingle()),
  })
}

export function useItemStoreSummary(itemId: string) {
  return useQuery({
    queryKey: ['item_store_summary', itemId],
    queryFn: () => run(supabase.from('item_store_summary').select('*').eq('item_id', itemId)),
  })
}

export function useItemPurchases(itemId: string) {
  return useQuery({
    queryKey: ['purchase_details', 'item', itemId],
    queryFn: () =>
      run(
        supabase
          .from('purchase_details')
          .select('*')
          .eq('item_id', itemId)
          .order('date', { ascending: false })
          .order('trip_created_at', { ascending: false }),
      ),
  })
}

export function useItemNames() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => run(supabase.from('items').select('id, name').order('name')),
  })
}

export function useRenameItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: Named) =>
      run(supabase.from('items').update({ name: name.trim() }).eq('id', id).select('id')),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => run(supabase.from('items').delete().eq('id', id).select('id')),
    onSuccess: () => qc.invalidateQueries(),
  })
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export function useStoreNames() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => run(supabase.from('stores').select('id, name').order('name')),
  })
}

export function useRenameStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: Named) =>
      run(supabase.from('stores').update({ name: name.trim() }).eq('id', id).select('id')),
    onSuccess: () => qc.invalidateQueries(),
  })
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export function useTripOverview() {
  return useQuery({
    queryKey: ['trip_overview'],
    queryFn: () =>
      run(
        supabase
          .from('trip_overview')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ),
  })
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trip', id],
    enabled: !!id,
    queryFn: async () => {
      const trip = await run(
        supabase.from('trips').select('id, date, store_id, stores(id, name)').eq('id', id!).maybeSingle(),
      )
      if (!trip) return null
      const purchases = await run(
        supabase
          .from('purchase_details')
          .select('*')
          .eq('trip_id', id!)
          .order('created_at'),
      )
      return { ...trip, purchases }
    },
  })
}

export type PurchaseInput = {
  item_id: string | null
  item_name: string
  qty: number
  unit_price: number
  is_promo: boolean
}

export type TripInput = {
  tripId: string | null
  storeId: string | null
  storeName: string
  date: string
  purchases: PurchaseInput[]
}

/** Save a trip and its purchases in one transaction (RPC `save_trip`). */
export function useSaveTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (t: TripInput) =>
      run(
        supabase.rpc('save_trip', {
          // null = new trip/store; the generated types don't know these args are nullable
          p_trip_id: t.tripId as string,
          p_store_id: t.storeId as string,
          p_store_name: t.storeName,
          p_date: t.date,
          p_purchases: t.purchases,
        }),
      ),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => run(supabase.from('trips').delete().eq('id', id).select('id')),
    onSuccess: () => qc.invalidateQueries(),
  })
}
