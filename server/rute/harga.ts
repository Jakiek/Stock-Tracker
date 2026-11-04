import { Router } from 'express'
import { z } from 'zod'
import { idPengguna } from '../auth'
import type { Db } from '../db'

const tickerSchema = z.string().regex(/^[A-Z]{4}$/, 'Ticker 4 huruf besar')
const hargaSchema = z.number().int('Harga bilangan bulat rupiah').positive('Harga harus positif')

export function ruteHarga(db: Db): Router {
  const r = Router()

  r.get('/', async (_req, res) => {
    const rows = await db.query<{ ticker: string; harga: number; diperbarui: Date }>(
      'SELECT ticker, harga, diperbarui FROM prices WHERE user_id = $1',
      [idPengguna(res)],
    )
    res.json(
      Object.fromEntries(
        rows.map((x) => [x.ticker, { harga: x.harga, diperbarui: x.diperbarui.toISOString() }]),
      ),
    )
  })

  r.put('/:ticker', async (req, res) => {
    const ticker = tickerSchema.parse(req.params.ticker)
    const { harga } = z.object({ harga: hargaSchema }).parse(req.body)
    const [row] = await db.query<{ diperbarui: Date }>(
      `INSERT INTO prices (user_id, ticker, harga, diperbarui) VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id, ticker) DO UPDATE SET harga = EXCLUDED.harga, diperbarui = now()
       RETURNING diperbarui`,
      [idPengguna(res), ticker, harga],
    )
    res.json({ harga, diperbarui: row.diperbarui.toISOString() })
  })

  r.delete('/:ticker', async (req, res) => {
    await db.query('DELETE FROM prices WHERE user_id = $1 AND ticker = $2', [
      idPengguna(res),
      req.params.ticker,
    ])
    res.status(204).end()
  })

  // Mengganti seluruh harga — data contoh & kosongkan data.
  r.put('/', async (req, res) => {
    const userId = idPengguna(res)
    const { peta, diperbarui } = z
      .object({ peta: z.record(tickerSchema, hargaSchema), diperbarui: z.iso.datetime() })
      .parse(req.body)
    await db.transaksi(async (q) => {
      await q('DELETE FROM prices WHERE user_id = $1', [userId])
      for (const [t, h] of Object.entries(peta)) {
        await q('INSERT INTO prices (user_id, ticker, harga, diperbarui) VALUES ($1, $2, $3, $4)', [
          userId,
          t,
          h,
          diperbarui,
        ])
      }
    })
    res.status(204).end()
  })

  return r
}
