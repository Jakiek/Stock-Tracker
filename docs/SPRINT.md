# SPRINT — MVP sampai checkpoint fase 5

Catatan kerja sprint (lihat `docs/SPRINT-PROMPT.md`). Bahan untuk sesi penjelasan dan bagian "Keterbatasan" di README.

## Checklist (SPRINT-PROMPT §4)

**Wajib**

- [x] 1. Fondasi: Vite + React + TS strict, token CSS → Tailwind, struktur folder, `LocalStorageRepository`
- [ ] 2. Mesin hitung (`money`, `fees`, `positions`, `portfolio`) + kasus uji 1–14 hijau
- [ ] 3. Form transaksi di drawer, Zod, fee terisi otomatis tapi bisa diubah (BELI, JUAL, DIVIDEN_TUNAI, SPLIT)
- [ ] 4. Daftar transaksi: filter broker, edit, hapus
- [ ] 5. Tabel posisi: mode Semua / BIONS / Stockbit + baris total
- [ ] 6. Halaman harga pasar manual lewat `ambilHarga()`
- [ ] 7. Dashboard: KPI (nilai portofolio utama), donat komposisi, transaksi terbaru
- [ ] 8. `seed.ts` 30–40 transaksi fiktif + tombol muat/kosongkan + langsung berisi saat pertama dibuka
- [ ] 9. Responsif: < 640px tabel jadi daftar kartu
- [ ] 10. Deploy Vercel + README

**Bagus kalau sempat**

- [ ] 11. Toggle "setelah biaya" pada unrealized P/L
- [ ] 12. Mode gelap tiga keadaan
- [ ] 13. Halaman Rekonsiliasi
- [ ] 14. REVERSE_SPLIT, RIGHTS, DIVIDEN_SAHAM di form
- [ ] 15. Perbandingan BIONS vs Stockbit
- [ ] 16. AreaChart tren nilai portofolio

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

## Yang di-skip atau disederhanakan

| Hal | Alasan |
|---|---|
| Fase 0 (validasi manual) | Dilewati atas keputusan pemilik; tarif di config belum diverifikasi dengan konfirmasi transaksi asli. |
