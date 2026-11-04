# ADR 002 — Backend di Vercel Functions + Postgres Neon

Status: diterima · 4 November 2026

## Konteks

Rencana awal (ROADMAP fase 6–7): Express + Prisma + Postgres, di-deploy terpisah di
Railway/Render. Target baru: aplikasi dipakai sungguhan dan data sinkron antara HP dan laptop,
dengan tenggat dekat.

## Keputusan

- **Express tetap**, tetapi di-deploy sebagai **Vercel Function** di proyek Vercel yang sama
  dengan frontend (`api/index.ts` mengekspor app Express). Frontend dan API satu domain:
  tidak perlu CORS, dan cookie sesi bisa `SameSite=Lax`.
- **Postgres dari Neon** lewat Vercel Marketplace. Prisma tetap sebagai ORM.
- **Auth: email + password**, hash dengan `bcryptjs` (murni JS, tanpa binary native — aman di
  serverless), sesi berupa JWT di cookie `httpOnly`.
- Server berjalan juga secara lokal (`npm run dev:server`) dengan Postgres lokal/Neon.

*Ditolak:* Railway/Render — akun tambahan, perlu CORS, free tier Render tidur ±50 detik.

## Konsekuensi

- Keputusan #6 (repository `async`) terbayar: komponen tidak berubah; yang berganti hanya
  repository yang dipilih di `src/main.tsx`.
- Keputusan #7 (posisi dihitung di klien) tetap: server hanya menyimpan transaksi & broker.
- Cold start Vercel Function ±1 detik pada permintaan pertama.
