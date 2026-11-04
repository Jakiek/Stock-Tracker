import bcrypt from 'bcryptjs'
import type { CookieOptions, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { GalatApi } from './galat'

export const NAMA_COOKIE = 'sesi'
const UMUR_SESI_DETIK = 60 * 60 * 24 * 30 // 30 hari

export const kredensialSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Email tidak valid')),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(200),
})

export const hashPassword = (p: string) => bcrypt.hash(p, 10)
export const cocokPassword = (p: string, hash: string) => bcrypt.compare(p, hash)

export function pasangSesi(res: Response, userId: string, rahasia: string, aman: boolean): void {
  const token = jwt.sign({}, rahasia, { subject: userId, expiresIn: UMUR_SESI_DETIK })
  res.cookie(NAMA_COOKIE, token, opsiCookie(aman))
}

export function hapusSesi(res: Response, aman: boolean): void {
  const { maxAge: _, ...opsi } = opsiCookie(aman)
  void _
  res.clearCookie(NAMA_COOKIE, opsi)
}

function opsiCookie(aman: boolean): CookieOptions {
  // httpOnly: tidak terbaca JavaScript (aman dari XSS mencuri token).
  // sameSite lax: cookie tidak ikut di POST lintas situs (perlindungan CSRF dasar).
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: aman,
    path: '/',
    maxAge: UMUR_SESI_DETIK * 1000,
  }
}

/** Middleware: memastikan ada sesi valid, lalu menaruh id pengguna di res.locals.userId. */
export function wajibMasuk(rahasia: string): RequestHandler {
  return (req, res, next) => {
    const token: unknown = req.cookies?.[NAMA_COOKIE]
    if (typeof token !== 'string') throw new GalatApi(401, 'Belum masuk')
    try {
      const isi = jwt.verify(token, rahasia)
      if (typeof isi === 'string' || !isi.sub) throw new Error('token tanpa sub')
      res.locals.userId = isi.sub
    } catch {
      throw new GalatApi(401, 'Sesi berakhir, silakan masuk lagi')
    }
    next()
  }
}

export function idPengguna(res: Response): string {
  const id: unknown = res.locals.userId
  if (typeof id !== 'string') throw new GalatApi(401, 'Belum masuk')
  return id
}
