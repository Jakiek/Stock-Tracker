import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

/** Galat yang aman ditampilkan ke pengguna, dengan status HTTP-nya. */
export class GalatApi extends Error {
  readonly status: number
  constructor(status: number, pesan: string) {
    super(pesan)
    this.status = status
  }
}

function kodePg(e: unknown): string | undefined {
  return typeof e === 'object' && e !== null && 'code' in e && typeof e.code === 'string'
    ? e.code
    : undefined
}

/** Semua galat jadi JSON { galat: string }. Detail internal tidak bocor ke klien. */
export const tanganiGalat: ErrorRequestHandler = (e, _req, res, _next) => {
  void _next
  if (e instanceof GalatApi) {
    res.status(e.status).json({ galat: e.message })
  } else if (e instanceof ZodError) {
    const i = e.issues[0]
    res.status(400).json({ galat: `${i.path.join('.') || 'data'}: ${i.message}` })
  } else if (kodePg(e) === '23503') {
    res.status(409).json({ galat: 'Broker tidak terdaftar atau masih dipakai transaksi' })
  } else if (kodePg(e) === '23505') {
    res.status(409).json({ galat: 'Data dengan id yang sama sudah ada' })
  } else if (
    typeof e === 'object' &&
    e !== null &&
    'type' in e &&
    e.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ galat: 'Body bukan JSON yang valid' })
  } else {
    console.error(e)
    res.status(500).json({ galat: 'Terjadi kesalahan di server' })
  }
}
