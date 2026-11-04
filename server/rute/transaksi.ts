import { Router } from 'express'
import { z } from 'zod'
import { periksaRiwayat } from '../../src/domain/positions'
import { transaksiBaruSchema } from '../../src/domain/schema'
import type { Transaction, TransaksiBaru } from '../../src/domain/types'
import type { Db, Kueri } from '../db'
import { idPengguna } from '../auth'
import { GalatApi } from '../galat'

type Baris = {
  id: string
  tanggal: string
  dibuat_pada: Date
  broker: string
  ticker: string
  jenis: Transaction['jenis']
  lembar: number
  harga: number
  fee: number
  pajak: number
  rasio: number | null
  jumlah: number | null
  tesis: string | null
  catatan: string | null
}

const KOLOM = `id, tanggal, dibuat_pada, broker, ticker, jenis, lembar, harga, fee, pajak,
  rasio, jumlah, tesis, catatan`

/** Baris database → Transaction. Kolom NULL menjadi field yang tidak ada (bukan null). */
export function keTransaksi(r: Baris): Transaction {
  return {
    id: r.id,
    tanggal: r.tanggal,
    dibuatPada: r.dibuat_pada.toISOString(),
    broker: r.broker,
    ticker: r.ticker,
    jenis: r.jenis,
    lembar: r.lembar,
    harga: r.harga,
    fee: r.fee,
    pajak: r.pajak,
    ...(r.rasio !== null ? { rasio: r.rasio } : {}),
    ...(r.jumlah !== null ? { jumlah: r.jumlah } : {}),
    ...(r.tesis !== null ? { tesis: r.tesis } : {}),
    ...(r.catatan !== null ? { catatan: r.catatan } : {}),
  }
}

const nilaiKolom = (t: TransaksiBaru) => [
  t.tanggal,
  t.broker,
  t.ticker,
  t.jenis,
  t.lembar,
  t.harga,
  t.fee,
  t.pajak,
  t.rasio ?? null,
  t.jumlah ?? null,
  t.tesis ?? null,
  t.catatan ?? null,
]

async function semua(q: Kueri, userId: string): Promise<Transaction[]> {
  const rows = await q<Baris>(`SELECT ${KOLOM} FROM transactions WHERE user_id = $1`, [userId])
  return rows.map(keTransaksi)
}

/**
 * Setiap perubahan dijalankan di dalam transaksi database yang dikunci per pengguna, lalu
 * riwayat lengkap diperiksa dengan periksaRiwayat() — fungsi domain yang SAMA dengan yang
 * dipakai form. Kalau riwayat jadi tidak konsisten (jual melebihi kepemilikan), ROLLBACK.
 */
async function ubahDenganPemeriksaan<T>(
  db: Db,
  userId: string,
  fn: (q: Kueri) => Promise<T>,
): Promise<T> {
  return db.transaksi(async (q) => {
    await q('SELECT pg_advisory_xact_lock(hashtext($1))', [userId])
    const hasil = await fn(q)
    const masalah = periksaRiwayat(await semua(q, userId))
    if (masalah) throw new GalatApi(409, masalah)
    return hasil
  })
}

/**
 * dibuatPada dijamin naik ketat per pengguna (pemecah seri transaksi setanggal), sama
 * seperti LocalStorageRepository. Aman dari balapan karena dipanggil di bawah kunci.
 */
async function capBerikut(q: Kueri, userId: string): Promise<number> {
  const [r] = await q<{ maks: Date | null }>(
    'SELECT max(dibuat_pada) AS maks FROM transactions WHERE user_id = $1',
    [userId],
  )
  const sekarang = Date.now()
  return r.maks && r.maks.getTime() >= sekarang ? r.maks.getTime() + 1 : sekarang
}

async function sisipkan(q: Kueri, userId: string, t: TransaksiBaru, cap: number) {
  const [r] = await q<Baris>(
    `INSERT INTO transactions (user_id, dibuat_pada, tanggal, broker, ticker, jenis, lembar,
       harga, fee, pajak, rasio, jumlah, tesis, catatan)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING ${KOLOM}`,
    [userId, new Date(cap), ...nilaiKolom(t)],
  )
  return keTransaksi(r)
}

/** Patch dari klien: null berarti "hapus field opsional ini" (JSON tidak mengenal undefined). */
const patchSchema = z.record(z.string(), z.unknown())

export function ruteTransaksi(db: Db): Router {
  const r = Router()

  r.get('/', async (_req, res) => {
    res.json(await semua(db.query, idPengguna(res)))
  })

  r.post('/', async (req, res) => {
    const userId = idPengguna(res)
    const tx = transaksiBaruSchema.parse(req.body)
    const baru = await ubahDenganPemeriksaan(db, userId, async (q) =>
      sisipkan(q, userId, tx, await capBerikut(q, userId)),
    )
    res.status(201).json(baru)
  })

  // Mengganti seluruh transaksi — "Muat data contoh", "Kosongkan data", impor.
  r.put('/', async (req, res) => {
    const userId = idPengguna(res)
    const txs = z.array(transaksiBaruSchema).max(5000).parse(req.body)
    const hasil = await ubahDenganPemeriksaan(db, userId, async (q) => {
      await q('DELETE FROM transactions WHERE user_id = $1', [userId])
      let cap = Date.now()
      const out: Transaction[] = []
      for (const t of txs) out.push(await sisipkan(q, userId, t, cap++))
      return out
    })
    res.json(hasil)
  })

  r.patch('/:id', async (req, res) => {
    const userId = idPengguna(res)
    const patch = patchSchema.parse(req.body)
    const hasil = await ubahDenganPemeriksaan(db, userId, async (q) => {
      const [lama] = await q<Baris>(
        `SELECT ${KOLOM} FROM transactions WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId],
      )
      if (!lama) throw new GalatApi(404, 'Transaksi tidak ditemukan')
      // id dan dibuatPada tidak boleh diubah: dibuatPada adalah pemecah seri urutan.
      const {
        id: _i,
        dibuatPada: _d,
        ...gabung
      }: Record<string, unknown> = {
        ...keTransaksi(lama),
        ...patch,
      }
      void _i
      void _d
      for (const k of Object.keys(gabung)) if (gabung[k] === null) delete gabung[k]
      const tx = transaksiBaruSchema.parse(gabung)
      const [r] = await q<Baris>(
        `UPDATE transactions SET tanggal = $3, broker = $4, ticker = $5, jenis = $6, lembar = $7,
           harga = $8, fee = $9, pajak = $10, rasio = $11, jumlah = $12, tesis = $13, catatan = $14
         WHERE id = $1 AND user_id = $2
         RETURNING ${KOLOM}`,
        [req.params.id, userId, ...nilaiKolom(tx)],
      )
      return keTransaksi(r)
    })
    res.json(hasil)
  })

  r.delete('/:id', async (req, res) => {
    const userId = idPengguna(res)
    await ubahDenganPemeriksaan(db, userId, (q) =>
      q('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, userId]),
    )
    res.status(204).end()
  })

  return r
}
