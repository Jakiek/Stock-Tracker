# Tracker Saham

Pencatat transaksi saham IDX untuk portofolio pribadi di dua broker — **BIONS (BNI)** untuk posisi utama dan **Stockbit** untuk transaksi kecil. Posisi, harga rata-rata, dan untung/rugi tidak pernah disimpan: semuanya dihitung ulang dari daftar transaksi.

**Demo:** _(tautan Vercel — diisi setelah deploy)_ · Aplikasi langsung berisi data contoh fiktif saat pertama dibuka.

![Screenshot dashboard](docs/screenshot-dashboard.png)

## Fitur

- **Transaksi** — beli, jual, dividen tunai, stock split, reverse split, rights issue, dividen saham. Form di drawer, divalidasi Zod, fee & PPh terisi otomatis dari tarif broker tapi tetap bisa diubah sesuai konfirmasi.
- **Posisi per broker** — BBCA di BIONS dan BBCA di Stockbit adalah dua baris terpisah. Mode Semua / BIONS / Stockbit, baris total yang hanya menjumlahkan.
- **Unrealized "setelah biaya"** — toggle untuk mengurangi fee jual + PPh final yang pasti dibayar saat menjual.
- **Dashboard** — nilai portofolio, modal, unrealized, realized tahun berjalan, komposisi, posisi teratas, transaksi terbaru.
- **BIONS vs Stockbit** — berapa yang tergerus biaya di tiap broker, dan apakah trade kecil di Stockbit sebenarnya untung.
- **Rekonsiliasi** — sandingkan harga rata-rata hitungan aplikasi dengan angka di aplikasi broker.
- **Harga pasar manual** — dengan penanda kapan terakhir diperbarui.
- Mode gelap tiga keadaan (terang, gelap, ikut sistem), kerapatan tabel, tampilan kartu di HP.

## Menjalankan

Butuh Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run test:run   # Vitest sekali jalan (npm test untuk mode watch)
npm run lint
npm run build
```

Data tersimpan di `localStorage` browser. Pengaturan → "Kosongkan data" untuk mulai dari nol, atau "Muat data contoh" untuk kembali ke data demo.

## Alasan di balik arsitektur

**Transaksi adalah satu-satunya sumber kebenaran.** Aplikasi ini tidak menyimpan "posisi saat ini". Setiap kali layar butuh posisi, `hitungPosisi()` membangunnya ulang dari seluruh transaksi, diurutkan berdasarkan tanggal lalu `dibuatPada`. Konsekuensinya, salah input bisa diperbaiki dengan mengubah satu transaksi tanpa merusak histori, dan tidak ada dua sumber data yang bisa saling bertentangan. Biayanya hanya komputasi — dan ribuan transaksi selesai dalam hitungan milidetik. Uang selalu bilangan bulat rupiah dan jumlah selalu lembar (bukan lot), supaya corporate action dan pembulatan tidak menghasilkan pecahan.

**Fee disimpan, bukan dihitung ulang saat ditampilkan.** Tarif broker di `config/brokers.ts` hanya dipakai untuk mengisi nilai awal di form. Yang tersimpan di transaksi adalah angka yang benar-benar didebit. Kalau fee dihitung ulang dari config setiap kali ditampilkan, maka begitu broker mengubah tarif dan config diperbarui, seluruh harga rata-rata dan realized P/L historis ikut berubah diam-diam — tanpa error, angkanya saja yang salah. Saat mengedit transaksi lama pun, fee tersimpan dipertahankan; menghitung ulang harus diklik secara eksplisit.

**Posisi dipisah per broker.** Kunci posisi adalah `(ticker, broker)`. Rata-rata gabungan BBCA di BIONS dan di Stockbit adalah angka yang tidak cocok dengan aplikasi mana pun dan tidak menjawab pertanyaan apa pun. Dengan pemisahan ini, setiap baris bisa langsung disandingkan dengan angka di aplikasi brokernya (halaman Rekonsiliasi), dan perbandingan BIONS vs Stockbit jadi mungkin. Yang digabung hanya total portofolio — penjumlahan, tidak pernah perata-rataan.

**Penyimpanan dibuat sebagai interface.** Komponen tidak tahu data disimpan di mana: mereka memakai hook, hook memakai `TransactionRepository`, dan implementasinya dipilih di satu baris di `main.tsx`. Semua method-nya `async` walaupun `localStorage` sinkron, karena di fase 6 implementasinya diganti `ApiRepository` yang memanggil REST API. Kalau method-nya sinkron sekarang, setiap komponen harus ikut diubah nanti. Dengan desain ini, targetnya: pindah ke backend tanpa satu pun file di `src/components/` berubah.

## Struktur

```
src/
├── config/      tarif broker — tidak mengimpor apa pun
├── domain/      tipe, skema Zod, rumus (fees, positions, portfolio, money) — hanya boleh impor config/
├── data/        repository, harga manual, preferensi, data contoh
├── hooks/       Context + hook: transaksi, harga, preferensi, posisi
├── components/  komponen aplikasi + ui/ (primitif tanpa logika bisnis)
└── pages/       Dashboard, Transaksi, Posisi, Harga, Rekonsiliasi, Pengaturan
```

Aturan lapisan dipaksakan oleh ESLint (`no-restricted-imports`, `no-restricted-globals`): `domain/` yang mengimpor React, `localStorage`, `fetch`, atau `data/` gagal di `npm run lint`.

Dokumen rancangan lengkap ada di [`docs/`](docs/): [ARCHITECTURE](docs/ARCHITECTURE.md), [ROADMAP](docs/ROADMAP.md), [DESIGN](docs/DESIGN.md), dan catatan sprint di [SPRINT](docs/SPRINT.md).

## Testing

Test difokuskan ke tempat uang dihitung. `src/domain/__tests__/` memuat 15 kasus uji wajib dari [ARCHITECTURE §6](docs/ARCHITECTURE.md), termasuk:

- **#12** input tidak urut tanggal menghasilkan posisi yang identik,
- **#13** beli & jual di tanggal yang sama diurutkan oleh `dibuatPada`, bukan urutan array,
- **#14** jual melebihi kepemilikan melempar error, bukan menghasilkan lembar negatif,
- **#10** fee minimum (`Math.max`) dibuktikan lewat config palsu, walaupun kedua broker saat ini tidak punya fee minimum.

Angka harapan di tiap test dihitung manual dan ditulis di komentarnya.

## Keterbatasan & langkah berikutnya

- **Tarif broker belum diverifikasi** dengan konfirmasi transaksi asli (fase 0 dilewati). Tarif jual diasumsikan sudah termasuk PPh final 0,1%. Kasus uji #15 dengan data asli masih `it.todo`; yang ada sekarang versi data fiktif.
- **Data hanya di browser ini.** Belum ada backend: `localStorage` tidak tersinkron antarperangkat. Backend Express + Postgres + Prisma (fase 6) dan autentikasi (fase 7) belum dikerjakan; desainnya sudah disiapkan lewat repository `async` yang dipilih hanya di `main.tsx`.
- **Harga pasar diisi manual.** `ambilHarga()` adalah satu-satunya pintu baca, jadi menggantinya dengan API harga cukup di satu fungsi.
- **Belum ada grafik tren nilai portofolio** — butuh histori harga yang belum ada di model data.
- **Data contoh fiktif.** Ticker nyata dipakai agar mudah dibaca, tetapi transaksi, harga, dividen, dan stock split ICBP di dalamnya adalah karangan.
- Input harga rata-rata di halaman Rekonsiliasi tidak disimpan.
- Keputusan kecil lain dan hal yang disederhanakan selama sprint tercatat di [`docs/SPRINT.md`](docs/SPRINT.md).

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · Zod · Recharts · Vitest · ESLint + Prettier. Font: Plus Jakarta Sans (typeface Indonesia) dan JetBrains Mono untuk kode ticker.
