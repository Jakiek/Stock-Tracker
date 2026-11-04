import cookieParser from 'cookie-parser'
import express from 'express'
import { wajibMasuk } from './auth'
import type { Db } from './db'
import { tanganiGalat } from './galat'
import { ruteAuth } from './rute/auth'
import { ruteBroker } from './rute/broker'
import { ruteHarga } from './rute/harga'
import { ruteTransaksi } from './rute/transaksi'

export type OpsiApp = {
  db: Db
  rahasiaJwt: string
  /** true di produksi (HTTPS): cookie hanya dikirim lewat HTTPS. */
  cookieAman: boolean
}

/**
 * Server hanya MENYIMPAN transaksi, broker, dan harga. Posisi dan P/L tetap dihitung
 * di klien (keputusan #7) — tidak ada endpoint posisi.
 */
export function buatApp({ db, rahasiaJwt, cookieAman }: OpsiApp) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/api/sehat', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api/auth', ruteAuth(db, rahasiaJwt, cookieAman))

  const masuk = wajibMasuk(rahasiaJwt)
  app.use('/api/transactions', masuk, ruteTransaksi(db))
  app.use('/api/brokers', masuk, ruteBroker(db))
  app.use('/api/prices', masuk, ruteHarga(db))

  app.use('/api', (_req, res) => {
    res.status(404).json({ galat: 'Endpoint tidak ditemukan' })
  })
  app.use(tanganiGalat)
  return app
}
