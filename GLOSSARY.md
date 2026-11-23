# MuNa (Murah Mana)

Pencatat belanja pribadi untuk membandingkan harga Barang yang sama antar Toko dari waktu ke waktu.

## Language

### Tempat & barang

**Barang**:
Produk spesifik dengan ukuran/varian tetap, mis. "Telur 1 kg" atau "Rinso Cair 800ml". Ukuran atau varian berbeda = Barang berbeda.
_Avoid_: Item, produk

**Toko**:
Satu tempat belanja spesifik, termasuk cabangnya. "Indomaret Jl. Merdeka" dan "Indomaret Jl. Sudirman" adalah dua Toko berbeda.
_Avoid_: Merchant, outlet, gerai

### Pencatatan

**Belanja**:
Satu kunjungan ke satu Toko pada satu tanggal, berisi satu atau lebih Pembelian.
_Avoid_: Transaksi, nota, struk, trip

**Pembelian**:
Satu baris dalam Belanja: satu Barang beserta jumlah (qty) dan Harga Satuan yang dibayar.
_Avoid_: Item belanja, line item

**Harga Satuan**:
Harga yang benar-benar dibayar untuk satu unit Barang dalam sebuah Pembelian. Satu-satunya dasar perbandingan antar Toko.
_Avoid_: Harga, harga item, total

**Promo**:
Tanda pada Pembelian bahwa Harga Satuannya dipengaruhi diskon sementara, sehingga tidak mewakili harga normal Toko tersebut.
_Avoid_: Diskon, sale

### Perbandingan

**Harga Acuan**:
Harga Satuan non-Promo terakhir sebuah Barang di satu Toko. Inilah harga yang dibandingkan antar Toko.
_Avoid_: Harga terakhir, harga normal

**Toko Termurah**:
Toko dengan Harga Acuan terendah untuk suatu Barang.
_Avoid_: Toko terbaik, best price

**Data Lama**:
Harga Acuan yang tercatat lebih dari 90 hari lalu. Tetap ikut dibandingkan, tapi ditandai karena mungkin sudah tidak berlaku.
_Avoid_: Kedaluwarsa, expired
