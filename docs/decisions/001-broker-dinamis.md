# ADR 001 — Broker sebagai data, bukan config

Status: diterima · 4 November 2026

## Konteks

Sampai fase 5, daftar broker di-hardcode: `type Broker = 'BIONS' | 'STOCKBIT'`, `BROKERS` di
`config/brokers.ts`, `z.enum([...])` di skema, dan string `'BIONS'`/`'STOCKBIT'` di beberapa
komponen. Panel dashboard selalu "BIONS vs Stockbit" walaupun salah satunya tidak dipakai, dan
broker lain (Ajaib, IPOT, ...) tidak bisa dicatat sama sekali.

## Keputusan

1. **Broker adalah data milik pengguna.** Disimpan lewat `BrokerRepository` (semua method `async`,
   sama seperti `TransactionRepository`). Di backend menjadi tabel `Broker`.
   `config/brokers.ts` hanya berisi **daftar awal** (BIONS, Stockbit) yang dimuat sekali.
2. **`Broker` = `string`** — id broker, huruf besar, dibentuk dari nama (`"Ajaib"` → `AJAIB`),
   tidak bisa diubah setelah dibuat. Data lama (`'BIONS'`, `'STOCKBIT'`) tetap valid tanpa migrasi.
   *Ditolak:* UUID — lebih murni, tapi butuh migrasi data lama dan ekspor JSON jadi sulit dibaca.
3. **Domain tetap murni.** `hitungBiaya(nilai, config, jenis)` menerima `BrokerConfig` sebagai
   argumen, tidak lagi mencari di `BROKERS`. `ringkasanPerBroker()` mengambil daftar broker dari
   transaksi, sehingga panel hanya menampilkan broker yang benar-benar dipakai.
4. **Skema Zod hanya memeriksa format id**, bukan keanggotaan. Skema tidak tahu daftar broker
   milik pengguna; form memeriksa bahwa broker terdaftar sebelum menyimpan.
5. **Broker yang masih punya transaksi tidak bisa dihapus**, supaya tidak ada transaksi yatim.

## Konsekuensi

- Keputusan terkunci #4 (fee dihitung otomatis tetapi disimpan) membuat fitur ini aman:
  mengubah tarif broker di Pengaturan hanya mengubah nilai default di form untuk transaksi
  berikutnya. Histori tidak ikut berubah.
- Keputusan #5 (kunci posisi `(ticker, broker)`) tidak berubah.
- Tampilan nama broker selalu lewat daftar broker; id yang tidak dikenal ditampilkan apa adanya.
