# Handoff: MuNa (Murah Mana)

Dokumen ini adalah titik awal untuk membangun MuNa. Isinya hasil sesi tanya-jawab desain (22–23 Nov 2026). Semua keputusan di sini **sudah disepakati**, kecuali yang ditandai _Asumsi_.

Bacaan terkait:
- [`GLOSSARY.md`](./GLOSSARY.md): istilah domain yang baku. Pakai istilah ini di UI, diskusi, dan nama komponen.
- [`docs/adr/0001-barang-identitas-nama-ukuran.md`](./docs/adr/0001-barang-identitas-nama-ukuran.md): kenapa Barang = nama + ukuran.

---

## 1. Tujuan

Aplikasi web pribadi untuk **mencatat Belanja** dan **membandingkan Harga Satuan Barang yang sama antar Toko dari waktu ke waktu**.

Pertanyaan utama yang harus dijawab app: _"Barang X paling murah di Toko mana, dan kapan terakhir saya beli di sana?"_

Contoh alur:
1. Beli telur Rp20.000, rinso Rp17.000, dan beras Rp80.000 di Toko A.
2. Beberapa waktu kemudian beli barang yang sama di Toko B.
3. Beberapa hari lagi beli lagi di Toko A.
4. Buka "Telur 1 kg" untuk melihat perbandingan harga Toko A vs Toko B, lengkap dengan tanggal pembelian.

## 2. Pengguna & platform

- **Satu pengguna** (pemilik). Login Supabase Auth email + password. **Sign-up publik dimatikan**; akun dibuat manual di dashboard Supabase.
- **Mobile-first** responsive web (bisa "Add to Home Screen"), tetap rapi di desktop.
- UI **Bahasa Indonesia**; kode & database **Bahasa Inggris** (lihat §8).

## 3. Model domain

| Istilah | Arti singkat |
|---|---|
| **Barang** | Produk + ukuran/varian tetap ("Telur 1 kg", "Rinso Cair 800ml"). Ukuran berbeda berarti Barang berbeda. |
| **Toko** | Tempat belanja spesifik, termasuk cabang ("Indomaret Jl. Merdeka"). |
| **Belanja** | Satu kunjungan: 1 Toko + 1 tanggal + ≥1 Pembelian. |
| **Pembelian** | Satu baris dalam Belanja: Barang + qty + Harga Satuan + tanda Promo. |
| **Harga Satuan** | Harga yang dibayar untuk 1 unit Barang. Satu-satunya dasar perbandingan. |
| **Promo** | Tanda bahwa Harga Satuan dipengaruhi diskon sementara. |
| **Harga Acuan** | Harga Satuan **non-Promo terakhir** sebuah Barang di satu Toko. |
| **Toko Termurah** | Toko dengan Harga Acuan terendah untuk suatu Barang. |
| **Data Lama** | Harga Acuan yang tercatat > 90 hari lalu. |

### Aturan
- Nama Barang dan Toko **unik tanpa membedakan huruf besar/kecil** ("telur 1 kg" = "Telur 1 Kg").
- Dalam satu Belanja, **satu Barang hanya boleh satu Pembelian** (gunakan qty).
- Total Pembelian = qty × Harga Satuan. Total Belanja = jumlah total Pembeliannya. Keduanya dihitung, tidak disimpan.
- Tanggal Belanja **hanya tanggal** (tanpa jam), default hari ini.
- Harga dalam **Rupiah utuh** (tanpa desimal).

## 4. Aturan perbandingan

Aturan ini adalah inti app. Setiap baris tabel menjadi skenario tes.

| # | Situasi | Hasil yang diharapkan |
|---|---|---|
| 1 | Toko A Harga Acuan 20.000; Toko B Harga Acuan 18.000 | B = Toko Termurah; kartu A menampilkan selisih "+Rp2.000" |
| 2 | Toko A Harga Acuan 20.000; Toko B pembelian terakhir 17.000 **Promo**, tapi sebelumnya ada non-Promo 21.000 | Harga Acuan B = 21.000, jadi A = Toko Termurah. Kartu B juga menampilkan "promo terakhir Rp17.000" |
| 3 | Toko C Harga Acuan 18.000 dari 8 bulan lalu; Toko A 20.000 minggu lalu | C = Toko Termurah, tapi kartu C tampil pudar dengan label "data lama". Data Lama **tetap ikut** dibandingkan |
| 4 | Toko B **hanya** punya Pembelian Promo (15.000); Toko A Harga Acuan 20.000 | B tidak punya Harga Acuan dan tidak ikut perhitungan Termurah. Kartu B: "Belum ada harga normal · promo terakhir Rp15.000" |
| 5 | Toko A dan B sama-sama Harga Acuan 20.000 (terendah) | **Keduanya** mendapat badge Termurah |
| 6 | Barang baru dibeli di satu Toko saja | Tidak ada badge. Teks: "Belum ada pembanding dari Toko lain" |
| 7 | Dua Belanja di Toko yang sama pada tanggal yang sama | "Terakhir" ditentukan dari tanggal Belanja, lalu waktu dibuat (`created_at`) sebagai penentu seri |

_Asumsi (turunan dari #4 & #6, belum ditanyakan eksplisit):_ badge Termurah hanya muncul jika **≥ 2 Toko punya Harga Acuan**. Jadi kalau A punya Harga Acuan dan B hanya punya harga Promo, A tidak mendapat badge.

## 5. Layar & navigasi

Bottom nav dua tab + tombol melayang **"+ Belanja"** di kedua tab.

| Route | Layar | Isi |
|---|---|---|
| `/login` | Login | Email + password. Tanpa link daftar. |
| `/` | **Tab Barang** (halaman awal) | Kolom pencarian, lalu daftar Barang urut **terakhir dibeli**. Tiap baris: nama Barang, Toko Termurah + Harga Acuannya. Kalau baru ada 1 Toko, tampilkan Toko itu + harganya tanpa badge. |
| `/barang/:id` | **Detail Barang** | (1) Kartu per Toko: Harga Acuan + tanggal, badge Termurah, selisih vs termurah, info promo terakhir, gaya pudar untuk Data Lama. (2) Grafik garis Harga Satuan vs waktu, satu garis per Toko (titik Promo dibedakan). (3) Riwayat semua Pembelian, terbaru di atas: tanggal · Toko · qty · Harga Satuan · tanda Promo. Nama Barang bisa diedit. |
| `/belanja` | **Tab Belanja** | Riwayat Belanja terbaru di atas: tanggal, Toko, jumlah Barang, total. |
| `/belanja/baru` | **Form Belanja** | Pilih Toko (autocomplete + "+ Tambah 'X'"), tanggal (default hari ini), lalu daftar baris Pembelian: Barang (autocomplete + buat baru inline), qty, Harga Satuan (keypad numerik, format `20.000` otomatis), centang Promo. Barang duplikat dalam satu Belanja ditolak. |
| `/belanja/:id` | **Detail / edit Belanja** | Form yang sama dalam mode edit, plus tombol hapus (dengan konfirmasi; ikut menghapus Pembeliannya). |

- Barang/Toko **tidak bisa dihapus** selama masih dipakai Pembelian/Belanja. Nama keduanya bisa diedit.
- Tampilan: warna utama **hijau**, dark mode **mengikuti sistem**. Logo menyusul (pakai placeholder teks "MuNa").

## 6. Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS**
- **React Router** (routing), **TanStack Query** + **supabase-js** (data), **Recharts** (grafik)
- **Supabase**: Postgres, Auth, RLS. Skema via **migrasi SQL di `supabase/migrations/`** (Supabase CLI), bukan klik di dashboard.
- Deploy: **Vercel** (nanti, setelah MVP jalan, dengan konfirmasi pemilik dulu)

## 7. Database (usulan awal)

Semua tabel punya `user_id uuid not null default auth.uid()` + RLS `user_id = auth.uid()` untuk select/insert/update/delete.

```
stores     id uuid pk, user_id, name text not null, created_at
           unique (user_id, lower(name))

items      id uuid pk, user_id, name text not null, created_at
           unique (user_id, lower(name))

trips      id uuid pk, user_id, store_id → stores (on delete restrict),
           date date not null default current_date, created_at

purchases  id uuid pk, user_id, trip_id → trips (on delete cascade),
           item_id → items (on delete restrict),
           qty integer not null check (qty > 0),
           unit_price bigint not null check (unit_price >= 0),
           is_promo boolean not null default false, created_at
           unique (trip_id, item_id)
```

_Asumsi:_ `qty` bilangan bulat, karena ukuran sudah melekat di Barang (lihat ADR 0001).

**Logika perbandingan dihitung di database**, dalam view (`security_invoker = true` supaya RLS berlaku), menjadi satu sumber kebenaran untuk daftar Barang dan halaman detail:

- `item_store_summary`: satu baris per (item, store). Kolom: `reference_price`, `reference_date`, `last_promo_price`, `last_promo_date`, `is_stale`, `is_cheapest`, `diff_from_cheapest`.
- `item_overview`: satu baris per item untuk tab Barang. Kolom: `last_purchased_at`, Toko Termurah (bisa lebih dari satu kalau seri) + harganya, atau satu-satunya Toko kalau belum ada pembanding.

Format tampilan (Rupiah, tanggal Indonesia, label) dikerjakan di frontend.

**Tes:** skenario §4 ditulis sebagai tes pgTAP (`supabase test db`) terhadap view.

## 8. Pemetaan istilah → kode

| Domain (UI) | Kode / DB |
|---|---|
| Barang | `item` / `items` |
| Toko | `store` / `stores` |
| Belanja | `trip` / `trips` |
| Pembelian | `purchase` / `purchases` |
| Harga Satuan | `unit_price` |
| Promo | `is_promo` |
| Harga Acuan | `reference_price` |
| Toko Termurah | `is_cheapest` |
| Data Lama | `is_stale` |

## 9. Di luar MVP (sengaja ditunda)

Kategori Barang · foto/scan struk (OCR) · berbagi dengan keluarga · export CSV · harga per kg/ml (lihat ADR 0001) · offline mode · gabung (merge) Barang/Toko duplikat · logo final.

## 10. Urutan pengerjaan

1. **Scaffold**: `git init`, Vite + React + TS + Tailwind + Router + TanStack Query, layout bottom nav, tema hijau + dark mode.
2. **Database**: migrasi tabel + constraint + RLS, view `item_store_summary` & `item_overview`, tes pgTAP untuk semua skenario §4.
3. **Auth**: halaman login, route guard, logout.
4. **Form Belanja**: buat Belanja, autocomplete/buat Toko & Barang inline, baris Pembelian.
5. **Tab Barang**: daftar + pencarian + Toko Termurah.
6. **Detail Barang**: kartu per Toko, grafik, riwayat, edit nama.
7. **Tab Belanja**: riwayat, edit, hapus.
8. **Poles**: format Rupiah/tanggal, state kosong, loading/error, uji di HP.

## 11. Yang dibutuhkan dari pemilik sebelum langkah 2–3

- [ ] Buat **project Supabase baru** khusus MuNa.
- [ ] Isi `.env.local` (tidak di-commit) dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- [ ] Di Supabase → Authentication → Settings: **matikan "Allow new users to sign up"**.
- [ ] Buat akun sendiri lewat Authentication → Users → Add user.
- [ ] Install **Supabase CLI** (dan Docker kalau ingin DB lokal untuk tes pgTAP).
