import { Router } from 'express'
import {
  cocokPassword,
  hapusSesi,
  hashPassword,
  idPengguna,
  kredensialSchema,
  pasangSesi,
  wajibMasuk,
} from '../auth'
import type { Db } from '../db'
import { GalatApi } from '../galat'
import { isiBrokerAwal } from './broker'

export function ruteAuth(db: Db, rahasia: string, aman: boolean): Router {
  const r = Router()

  r.post('/daftar', async (req, res) => {
    const { email, password } = kredensialSchema.parse(req.body)
    const hash = await hashPassword(password)
    const userId = await db.transaksi(async (q) => {
      const ada = await q('SELECT 1 FROM users WHERE email = $1', [email])
      if (ada.length) throw new GalatApi(409, 'Email sudah terdaftar — silakan masuk')
      const [u] = await q<{ id: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, hash],
      )
      await isiBrokerAwal(q, u.id)
      return u.id
    })
    pasangSesi(res, userId, rahasia, aman)
    res.status(201).json({ email })
  })

  r.post('/masuk', async (req, res) => {
    const { email, password } = kredensialSchema.parse(req.body)
    const [u] = await db.query<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email],
    )
    // Pesan sama untuk email tak dikenal & sandi salah — tidak membocorkan email terdaftar.
    if (!u || !(await cocokPassword(password, u.password_hash))) {
      throw new GalatApi(401, 'Email atau kata sandi salah')
    }
    pasangSesi(res, u.id, rahasia, aman)
    res.json({ email })
  })

  r.post('/keluar', (_req, res) => {
    hapusSesi(res, aman)
    res.status(204).end()
  })

  r.get('/saya', wajibMasuk(rahasia), async (_req, res) => {
    const [u] = await db.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
      idPengguna(res),
    ])
    if (!u) throw new GalatApi(401, 'Akun tidak ditemukan')
    res.json({ email: u.email })
  })

  return r
}
