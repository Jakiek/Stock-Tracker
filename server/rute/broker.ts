import { Router } from 'express'
import { BROKER_AWAL } from '../../src/config/brokers'
import { brokerConfigSchema } from '../../src/domain/schema'
import type { BrokerConfig } from '../../src/domain/types'
import { idPengguna } from '../auth'
import type { Db, Kueri } from '../db'
import { GalatApi } from '../galat'

type Baris = {
  id: string
  nama: string
  fee_beli: number
  fee_jual: number
  fee_minimum: number
  pph_final: number
}

const keBroker = (r: Baris): BrokerConfig => ({
  id: r.id,
  nama: r.nama,
  feeBeli: r.fee_beli,
  feeJual: r.fee_jual,
  feeMinimum: r.fee_minimum,
  pphFinal: r.pph_final,
})

const KOLOM = 'id, nama, fee_beli, fee_jual, fee_minimum, pph_final'

export async function sisipkanBroker(q: Kueri, userId: string, b: BrokerConfig) {
  const [r] = await q<Baris>(
    `INSERT INTO brokers (user_id, id, nama, fee_beli, fee_jual, fee_minimum, pph_final)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${KOLOM}`,
    [userId, b.id, b.nama, b.feeBeli, b.feeJual, b.feeMinimum, b.pphFinal],
  )
  return keBroker(r)
}

/** Akun baru langsung punya daftar broker awal (BIONS, Stockbit). */
export async function isiBrokerAwal(q: Kueri, userId: string): Promise<void> {
  for (const b of BROKER_AWAL) await sisipkanBroker(q, userId, b)
}

export function ruteBroker(db: Db): Router {
  const r = Router()

  r.get('/', async (_req, res) => {
    const rows = await db.query<Baris>(
      `SELECT ${KOLOM} FROM brokers WHERE user_id = $1 ORDER BY urutan`,
      [idPengguna(res)],
    )
    res.json(rows.map(keBroker))
  })

  r.post('/', async (req, res) => {
    const b = brokerConfigSchema.parse(req.body)
    try {
      res.status(201).json(await sisipkanBroker(db.query, idPengguna(res), b))
    } catch (e) {
      if (typeof e === 'object' && e && 'code' in e && e.code === '23505') {
        throw new GalatApi(409, `Broker dengan id ${b.id} sudah ada`)
      }
      throw e
    }
  })

  r.patch('/:id', async (req, res) => {
    const userId = idPengguna(res)
    const [lama] = await db.query<Baris>(
      `SELECT ${KOLOM} FROM brokers WHERE user_id = $1 AND id = $2`,
      [userId, req.params.id],
    )
    if (!lama) throw new GalatApi(404, 'Broker tidak ditemukan')
    // id tidak bisa diubah — transaksi merujuk ke id.
    const b = brokerConfigSchema.parse({ ...keBroker(lama), ...req.body, id: lama.id })
    const [row] = await db.query<Baris>(
      `UPDATE brokers SET nama = $3, fee_beli = $4, fee_jual = $5, fee_minimum = $6, pph_final = $7
       WHERE user_id = $1 AND id = $2 RETURNING ${KOLOM}`,
      [userId, b.id, b.nama, b.feeBeli, b.feeJual, b.feeMinimum, b.pphFinal],
    )
    res.json(keBroker(row))
  })

  r.delete('/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM brokers WHERE user_id = $1 AND id = $2', [
        idPengguna(res),
        req.params.id,
      ])
    } catch (e) {
      if (typeof e === 'object' && e && 'code' in e && e.code === '23503') {
        throw new GalatApi(409, 'Broker masih dipakai transaksi — hapus transaksinya dulu')
      }
      throw e
    }
    res.status(204).end()
  })

  return r
}
