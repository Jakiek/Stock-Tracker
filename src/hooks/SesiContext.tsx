import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import * as auth from '../data/auth'
import type { Akun } from '../data/auth'
import type { Penyimpanan } from '../data/Penyimpanan'

type Nilai = {
  /** null = mode tamu: data hanya di browser ini. */
  akun: Akun | null
  masuk: (email: string, password: string) => Promise<void>
  daftar: (email: string, password: string) => Promise<void>
  keluar: () => Promise<void>
  /** Penyimpanan browser ini — dipakai untuk memindahkan data tamu ke akun. */
  penyimpananLokal: Penyimpanan
}

const Ctx = createContext<Nilai | null>(null)

/** Status masuk. Pemilihan penyimpanan berdasarkan status ini terjadi di src/main.tsx. */
export function SesiProvider({
  akun,
  onUbahAkun,
  penyimpananLokal,
  children,
}: {
  akun: Akun | null
  onUbahAkun: (a: Akun | null) => void
  penyimpananLokal: Penyimpanan
  children: ReactNode
}) {
  const masuk = useCallback(
    async (email: string, password: string) => onUbahAkun(await auth.masuk(email, password)),
    [onUbahAkun],
  )
  const daftar = useCallback(
    async (email: string, password: string) => onUbahAkun(await auth.daftar(email, password)),
    [onUbahAkun],
  )
  const keluar = useCallback(async () => {
    try {
      await auth.keluar()
    } finally {
      onUbahAkun(null)
    }
  }, [onUbahAkun])

  const nilai = useMemo(
    () => ({ akun, masuk, daftar, keluar, penyimpananLokal }),
    [akun, masuk, daftar, keluar, penyimpananLokal],
  )
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesi(): Nilai {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSesi harus dipakai di dalam <SesiProvider>')
  return v
}
