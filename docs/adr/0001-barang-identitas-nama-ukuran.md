# Barang diidentifikasi oleh nama + ukuran, tanpa normalisasi harga per kg/ml

Perbandingan harga hanya bermakna jika Barangnya setara, padahal "Telur" bisa berarti 1 kg, 10 butir, atau 1 tray. Kami memutuskan ukuran/varian menjadi bagian dari identitas Barang ("Telur 1 kg" ≠ "Telur ½ kg"), sehingga Harga Satuan bisa dibandingkan langsung antar Toko tanpa konversi. Cara ini menjaga input tetap cepat dan perbandingan selalu apple-to-apple, dengan konsekuensi bahwa ukuran berbeda dari produk yang sama tidak bisa dibandingkan.

## Considered Options

- **Nama bebas tanpa ukuran**: ditolak karena perbandingannya bisa menyesatkan.
- **Nama generik + ukuran & satuan per Pembelian, lalu dihitung Rp/kg atau Rp/ml**: ditunda (bukan ditolak). Opsi ini lebih fleksibel, tapi menambah beban input dan kerumitan konversi satuan. Kalau nanti ditambahkan, data lama perlu dimigrasi: Barang yang hanya beda ukuran digabung, dan ukurannya dipindah ke Pembelian.
