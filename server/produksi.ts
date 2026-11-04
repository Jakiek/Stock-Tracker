import { buatApp } from './app'
import { buatDb } from './db'

/** Konfigurasi dari environment. Melempar pesan jelas kalau ada yang belum diisi. */
export function bacaEnv(env: NodeJS.ProcessEnv = process.env) {
  const url = env.DATABASE_URL ?? env.POSTGRES_URL
  const rahasia = env.JWT_SECRET
  if (!url) throw new Error('DATABASE_URL belum diisi')
  if (!rahasia || rahasia.length < 32)
    throw new Error('JWT_SECRET belum diisi (minimal 32 karakter)')
  return { url, rahasia }
}

export function buatAppDariEnv(env: NodeJS.ProcessEnv = process.env) {
  const { url, rahasia } = bacaEnv(env)
  return buatApp({
    db: buatDb(url),
    rahasiaJwt: rahasia,
    cookieAman: env.NODE_ENV === 'production' || env.VERCEL === '1',
  })
}
