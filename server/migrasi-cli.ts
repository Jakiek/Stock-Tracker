// `npm run migrasi` — dijalankan juga saat build di Vercel (lihat script vercel-build).
import { buatDb } from './db'
import { jalankanMigrasi } from './migrations'

try {
  process.loadEnvFile('.env')
} catch {
  /* opsional */
}
const url =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.warn('DATABASE_URL tidak ada — migrasi dilewati (build frontend saja).')
} else {
  const db = buatDb(url)
  await jalankanMigrasi(db, console.log)
  await db.tutup()
  console.log('Migrasi selesai.')
}
