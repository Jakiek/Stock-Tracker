// Vercel Function: semua permintaan /api/* diarahkan ke sini (lihat vercel.json).
// Kode server sudah dibundel menjadi satu file saat build — lihat script build:api & ADR 002.
export { default } from '../server/dist/vercel.mjs'
