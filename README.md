# MuNa (Murah Mana)

Pencatat belanja pribadi untuk membandingkan Harga Satuan Barang yang sama antar Toko dari waktu ke waktu.
Desain & keputusan: [`HANDOFF.md`](./HANDOFF.md) · istilah: [`GLOSSARY.md`](./GLOSSARY.md) · [`docs/adr/`](./docs/adr/).

Stack: Vite + React + TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts, Supabase (Postgres + Auth + RLS).

## Struktur

```
supabase/migrations/   skema, RLS, view perbandingan, RPC save_trip
supabase/tests/        tes pgTAP untuk aturan perbandingan (HANDOFF §4)
src/lib/queries.ts     semua akses data (query & mutation)
src/lib/format.ts      format Rupiah & tanggal
src/pages/             Login, tab Barang, Detail Barang, tab Belanja, Form Belanja
```

Logika perbandingan (Harga Acuan, Toko Termurah, Data Lama) **hanya** ada di view database
`item_store_summary` & `item_overview`. Frontend cuma menampilkan.

## Pengembangan lokal

Butuh Node 22+, pnpm, dan Docker (untuk Supabase lokal).

```sh
pnpm install
pnpm db:start        # Supabase lokal (Postgres, Auth, Studio di http://127.0.0.1:54323)
pnpm db:reset        # terapkan ulang semua migrasi (MENGHAPUS data lokal)
pnpm db:test         # tes pgTAP
pnpm db:types        # generate src/lib/database.types.ts dari DB lokal
pnpm dev             # http://localhost:5555
```

`.env.local` (tidak di-commit) berisi URL & anon key. Untuk Supabase lokal, nilainya ada di `npx supabase status`.

Akun bisa dibuat lewat halaman **Daftar** (`/register`). Di Supabase lokal, konfirmasi email mati, jadi langsung masuk.

`pnpm dev --mode localdb` memakai `.env.localdb.local` (Supabase lokal) alih-alih `.env.local`.

## Menyambungkan ke project Supabase asli

1. Buat project Supabase. Di Authentication → Sign In / Providers, pastikan **Allow new users to sign up** menyala
   (halaman Daftar membutuhkannya). Pilih **Confirm email** nyala/mati sesuai kebutuhan.
2. Kalau Confirm email menyala: Authentication → URL Configuration, isi **Site URL** dengan alamat aplikasi
   (mis. `http://localhost:5555` atau URL Vercel) dan tambahkan alamat itu ke **Redirect URLs**.
3. Hubungkan & terapkan migrasi:
   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
4. Ganti isi `.env.local` dengan `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` dari Project Settings → API (lihat `.env.example`).

## Deploy (Vercel)

Belum dilakukan. `vercel.json` sudah berisi rewrite SPA. Set dua env var `VITE_SUPABASE_*` di Vercel,
lalu tambahkan URL Vercel ke Authentication → URL Configuration di Supabase.
