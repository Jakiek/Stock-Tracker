import { minta } from './http'

export type Akun = { email: string }

/** null = belum masuk, atau server tidak tersedia (mis. `npm run dev` tanpa server API). */
export async function cekSesi(): Promise<Akun | null> {
  try {
    return await minta<Akun>('GET', '/api/auth/saya')
  } catch {
    return null
  }
}

export const masuk = (email: string, password: string) =>
  minta<Akun>('POST', '/api/auth/masuk', { email, password })

export const daftar = (email: string, password: string) =>
  minta<Akun>('POST', '/api/auth/daftar', { email, password })

export const keluar = () => minta<void>('POST', '/api/auth/keluar')
