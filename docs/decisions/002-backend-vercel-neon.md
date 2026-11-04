# ADR 002 — Backend: Express + Postgres di Vercel + Neon, SQL tanpa ORM

Status: diterima · 4 November 2026

## Konteks

Rencana awal (ROADMAP fase 6–7): Express + Prisma + Postgres, di-deploy terpisah di
Railway/Render. Target baru: aplikasi dipakai sungguhan dan data sinkron antara HP dan laptop,
dengan tenggat dekat.

## Keputusan

- **Express 5**, di-deploy sebagai **Vercel Function** di proyek Vercel yang sama dengan
  frontend. Frontend dan API satu domain: tanpa CORS, cookie sesi `SameSite=Lax`.
- **Postgres dari Neon** lewat Vercel Marketplace.
- **SQL biasa lewat `pg` (node-postgres), bukan Prisma.** Prisma 7 butuh mengunduh binary
  schema engine dari `binaries.prisma.sh` saat `generate`/`migrate`; lingkungan pengembangan
  yang dipakai tidak bisa menjangkau host itu, sehingga skema & query tidak bisa diuji sebelum
  deploy. Dengan SQL biasa, seluruh API diuji terhadap Postgres sungguhan
  (`server/__tests__/api.test.ts`). Bonus: tanpa codegen, tanpa engine di serverless.
  Migrasi ditulis sebagai SQL di `server/migrations.ts` dan dijalankan oleh `npm run migrasi`
  (juga saat build di Vercel).
- **Server dibundel esbuild** (`npm run build:api` → `server/dist/vercel.mjs`), lalu
  `api/index.js` mengekspor ulang hasilnya. Builder Node Vercel men-*transpile* file satu per
  satu tanpa menulis ulang import; proyek ini ESM (`"type": "module"`) dengan import tanpa
  ekstensi, sehingga tanpa bundel fungsi gagal dengan `ERR_MODULE_NOT_FOUND`
  (diverifikasi lewat `vercel build` lokal).
- **Auth: email + kata sandi**, hash `bcryptjs` (murni JS), sesi JWT (`jsonwebtoken`) di cookie
  `httpOnly`, berlaku 30 hari.
- **Mode tamu tetap ada.** Tanpa masuk, aplikasi memakai localStorage dan data contoh — tautan
  demo tetap "satu klik langsung berisi". Data tamu bisa dipindahkan ke akun.

*Ditolak:* Railway/Render — akun tambahan, perlu CORS, free tier Render tidur ±50 detik.
*Ditolak:* Prisma — lihat di atas; bisa ditinjau ulang kalau engine bisa diunduh.

## Dependensi baru

| Paket | Untuk | Menggantikan |
|---|---|---|
| `express`, `cookie-parser` | server HTTP, baca cookie sesi | — (rencana fase 6) |
| `pg` | koneksi Postgres | Prisma (rencana awal) |
| `bcryptjs` | hash kata sandi | — (rencana fase 7) |
| `jsonwebtoken` | token sesi | — |
| `tsx` (dev) | menjalankan server TS lokal & migrasi | `ts-node` |
| `esbuild` (dev) | bundel API untuk Vercel | — |

## Konsekuensi

- Keputusan #6 (repository `async`) terbayar: komponen tidak berubah karena backend;
  yang berganti adalah penyimpanan yang dipilih di `src/main.tsx`.
- Keputusan #7 (posisi dihitung di klien) tetap. Server memakai ulang `periksaRiwayat()` dan
  skema Zod dari `src/domain` untuk MENOLAK perubahan yang membuat riwayat tidak konsisten,
  di dalam transaksi database yang dikunci per pengguna.
- Tanggal: parser `DATE` bawaan `pg` diganti agar mengembalikan teks `'YYYY-MM-DD'`, dan
  `ApiRepository` tetap menormalkan tanggal (CLAUDE.md).
- Uang tetap `integer` di database; tarif broker `numeric` (bukan uang).
- Cold start Vercel Function ±1 detik pada permintaan pertama.
