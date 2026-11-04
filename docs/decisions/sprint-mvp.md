# SPRINT — MVP sampai checkpoint fase 5

Catatan kerja sprint MVP (fase 1–5). Bahan untuk sesi penjelasan dan bagian "Keterbatasan" di README.

## Checklist

**Wajib**

- [x] 1. Fondasi: Vite + React + TS strict, token CSS → Tailwind, struktur folder, `LocalStorageRepository`
- [x] 2. Mesin hitung (`money`, `fees`, `positions`, `portfolio`) + kasus uji 1–14 hijau
- [x] 3. Form transaksi di drawer, Zod, fee terisi otomatis tapi bisa diubah (BELI, JUAL, DIVIDEN_TUNAI, SPLIT)
- [x] 4. Daftar transaksi: filter broker, edit, hapus
- [x] 5. Tabel posisi: mode Semua / BIONS / Stockbit + baris total
- [x] 6. Halaman harga pasar manual lewat `ambilHarga()`
- [x] 7. Dashboard: KPI (nilai portofolio utama), donat komposisi, transaksi terbaru
- [x] 8. `seed.ts` 30–40 transaksi fiktif + tombol muat/kosongkan + langsung berisi saat pertama dibuka
- [x] 9. Responsif: < 640px tabel jadi daftar kartu
- [ ] 10. Deploy Vercel + README — README selesai; deploy menunggu akun Vercel/GitHub pemilik

**Bagus kalau sempat**

- [x] 11. Toggle "setelah biaya" pada unrealized P/L
- [x] 12. Mode gelap tiga keadaan
- [x] 13. Halaman Rekonsiliasi
- [x] 14. REVERSE_SPLIT, RIGHTS, DIVIDEN_SAHAM di form
- [x] 15. Perbandingan BIONS vs Stockbit
- [ ] 16. AreaChart tren nilai portofolio — **di-skip**, lihat bawah

## Keputusan yang tidak tertulis di dokumen

| # | Keputusan | Alasan |
|---|---|---|
| K1 | TypeScript dipin ke `~5.9`, bukan 7.x bawaan template Vite terbaru | `typescript-eslint` belum mendukung TS ≥ 6.1; ESLint ada di stack wajib. |
| K2 | Template Vite memakai `oxlint`; diganti ESLint + Prettier | Stack di dokumen menyebut ESLint + Prettier. |
| K3 | Tailwind v4 dipasang lewat plugin resminya `@tailwindcss/vite` | Cara instalasi Tailwind v4 untuk Vite; bukan dependensi baru di luar Tailwind. |
| K4 | Tipe `Broker` dan `BrokerConfig` didefinisikan di `config/brokers.ts`, diekspor ulang dari `domain/types.ts` | `config/` tidak boleh mengimpor apa pun, padahal `BROKERS` butuh tipe `Broker`. |
| K5 | Skema Zod tinggal di `src/domain/schema.ts` | Zod bukan I/O maupun React; satu skema dipakai form, repository, dan nanti server (fase 6 dipindah ke paket bersama). |
| K6 | `TransactionRepository` ditambah `replaceAll(txs)` | Dibutuhkan "Muat data contoh"/"Kosongkan data" secara atomik. Tetap async; di fase 6 `ApiRepository` bisa mengimplementasikannya dengan endpoint bulk atau loop. |
| K7 | `LocalStorageRepository` menerima `storage` lewat konstruktor | Test bisa memakai storage palsu tanpa jsdom (tidak menambah dependensi). |
| K8 | `dibuatPada` dijamin naik ketat oleh repository | Dua transaksi yang ditambah dalam milidetik yang sama tetap punya urutan deterministik. |
| K9 | Aturan lapisan dipaksakan oleh ESLint (`no-restricted-imports`, `no-restricted-globals`) | Pelanggaran lapisan gagal di `npm run lint`, bukan cuma konvensi. |
| K10 | `index.css` adalah satu-satunya file CSS | Entry Tailwind + token desain; "alasan khusus" yang diizinkan CLAUDE.md. |
| K11 | `RepositoryProvider` tinggal di `src/hooks/RepositoryContext.tsx` | Ia komponen React, jadi milik lapisan presentasi, bukan `data/`. |
| K12 | Urutan transaksi: `tanggal` → `dibuatPada` → `id` | `id` hanya penjaga terakhir agar sort selalu deterministik bila dua cap waktu identik. |
| K13 | Lot tidak pernah pecahan: odd lot tampil sebagai `12 lot + 50 lbr` | Reverse split / dividen saham bisa menghasilkan sisa < 100 lembar yang sah di IDX. Ini bukan lot pecahan. |
| K14 | Posisi tanpa harga pasar: `nilai = modal`, unrealized 0, ditandai "tanpa harga" | Tidak memakai `hargaRataRata` sebagai input rumus; total portofolio tetap masuk akal sebelum harga diisi. |
| K15 | Bentuk ringkas rupiah memakai koma desimal (`Rp1,4 jt`) lewat `Intl`, bukan `toFixed` | Contoh kode di DESIGN.md §4.1 memakai `toFixed(1)` yang menghasilkan titik (`1.4`), bertentangan dengan contoh tampilannya sendiri. |
| K16 | Realized YTD = realized semua transaksi − realized transaksi sebelum 1 Januari | Tetap diturunkan dari transaksi; tidak menyimpan realized per transaksi. |
| K17 | Jual melebihi kepemilikan melempar `TransaksiTidakKonsisten` (subclass `Error`) | UI bisa menampilkan transaksi mana yang bermasalah. |
| K18 | Format tampilan (`rp`, `formatLot`, ...) tinggal di `domain/money.ts` | Sesuai ARCHITECTURE §2 ("pembulatan & format rupiah"); murni `Intl`, tanpa I/O. |
| K19 | `ringkasanPerBroker()` (item 15) dibuat di domain sejak fase 2 | Murah ditulis bersama test-nya; UI-nya menyusul kalau sempat. |
| K20 | Navigasi pakai hash (`#/posisi`) dengan `useSyncExternalStore`, tanpa react-router | Tidak menambah dependensi di luar daftar; tidak perlu konfigurasi rewrite di Vercel. |
| K21 | State UI lewat tiga Context: transaksi, harga, preferensi | Sesuai "useState + Context, tanpa Redux". Posisi tidak punya state — selalu `useMemo(hitungPosisi)`. |
| K22 | Form menerima jumlah dalam lot atau lembar (pilihan satuan); yang disimpan selalu lembar | Lot hanya di lapisan tampilan; odd lot (sisa reverse split) tetap bisa dicatat. |
| K23 | Saat edit, fee & pajak yang TERSIMPAN dipertahankan; "Hitung otomatis" harus diklik eksplisit | Aturan domain #4: fee tidak pernah dihitung ulang diam-diam dari config. |
| K24 | Sebelum menyimpan, form menjalankan `periksaRiwayat()` atas riwayat + transaksi baru | Data yang membuat `JUAL` melebihi kepemilikan tidak pernah masuk ke penyimpanan. |
| K25 | Kolom "Arus kas" di daftar transaksi berwarna netral dengan tanda +/− | Uang keluar saat BELI bukan rugi; hijau/merah hanya untuk untung/rugi (DESIGN §2). |
| K26 | Hapus transaksi memakai konfirmasi dua klik di baris, bukan `window.confirm` | Tidak memblokir UI dan tetap mencegah salah klik. |
| K27 | Tabel posisi hanya menampilkan posisi terbuka; realized posisi tertutup tetap masuk ringkasan | Tabel menjawab "saya punya apa sekarang?". |
| K28 | Form mendukung ketujuh jenis transaksi (item 14 selesai) | Form sudah generik; biayanya kecil. |
| K29 | Ikon sebagai SVG inline (`components/ui/Icon.tsx`) | Tidak menambah dependensi ikon. |
| K30 | Harga pasar disimpan per ticker (bukan per ticker+broker) | Harga pasar BBCA sama di broker mana pun; posisi tetap dipisah per broker. |
| K31 | `ambilHarga()` async dan dipanggil per ticker oleh `PricesProvider` | Satu pintu baca; di fase 8 isinya diganti API tanpa mengubah pemanggil. |
| K32 | Harga lebih dari 7 hari ditandai `--warn` di halaman Harga | DESIGN §6: angka portofolio hanya sebaik harga terakhir. |
| K33 | Dashboard: baris 2 = posisi teratas (8) + donat (4); baris 3 = transaksi terbaru (7) + BIONS vs Stockbit (5) | Slot "tren nilai portofolio" di DESIGN §6 kosong karena AreaChart di-skip. |
| K34 | Rekonsiliasi menghitung avg dari `modal / lembar` lewat `rekonsiliasi()` di domain, input avg broker tidak disimpan | `hargaRataRata` tetap bukan input rumus; input rekonsiliasi bersifat sesaat. |
| K35 | KPI "Realized" menampilkan tahun berjalan (YTD), dengan realized sepanjang waktu & dividen sebagai teks sekunder | DESIGN §6 menyebut "Realized YTD". |
| K36 | Peringatan ukuran chunk > 500 kB dari Vite dibiarkan | Berasal dari Recharts; bukan error. Code-splitting bisa dilakukan setelah sprint. |
| K37 | Data contoh dimuat otomatis hanya bila perangkat belum pernah membuka aplikasi DAN penyimpanan kosong (penanda `saham-tracker:sudah-dibuka`) | Pengunjung pertama langsung melihat isi; setelah "Kosongkan data", aplikasi tidak mengisi ulang sendiri. |
| K38 | Pemuatan pertama memakai satu promise per sesi | Efek ganda React StrictMode tidak membaca penyimpanan yang masih kosong. |
| K39 | "Muat data contoh" dan "Kosongkan data" menimpa transaksi DAN harga, dengan konfirmasi dua klik bila ada data | Mencegah kehilangan data tanpa sengaja; ada tombol Ekspor JSON untuk cadangan. |
| K40 | Data contoh: 36 transaksi fiktif, 1 stock split (ICBP 1:5), BBCA di kedua broker, ≥3 posisi rugi; fee diisi `hitungBiaya()` | Konsistensinya dijaga test `data/__tests__/seed.test.ts`. Ticker nyata, angka karangan — ditulis jelas di kode & README. |
| K41 | Tanggal harga contoh tetap (3 Nov 2026), bukan "sekarang" | Jujur: setelah 7 hari halaman Harga menandainya sebagai basi — sekaligus memperlihatkan fiturnya. |
| K42 | Screenshot README diambil dari build lokal, bukan placeholder kosong | Gambar nyata lebih berguna; bisa diganti setelah deploy. |
| K43 | Bug ditemukan lewat uji end-to-end (Playwright, di luar repo): input angka mengubah teks `3.400` → `3400` saat fokus, sehingga ketikan baru tersambung ke angka lama (fee `34003500`). Diperbaiki: teks tidak berubah saat fokus | Contoh nyata kenapa nilai uang di form perlu diuji, bukan cuma rumusnya. |

## Yang di-skip atau disederhanakan

| Hal | Alasan |
|---|---|
| Fase 0 (validasi manual) | Dilewati atas keputusan pemilik; tarif di config belum diverifikasi dengan konfirmasi transaksi asli. |
| AreaChart tren nilai portofolio (item 16) | Butuh histori harga; model data belum menyimpannya. Model baru tidak ditambahkan tanpa dibahas dulu. |
| Deploy ke Vercel | Butuh akun GitHub/Vercel pemilik — dikerjakan pemilik. |
| Test komponen & hook | Sesuai ARCHITECTURE §10 (komponen "hampir tidak ada"). Alur utama diverifikasi manual dengan skrip Playwright sekali jalan, tidak dimasukkan ke repo agar tidak menambah dependensi. |
