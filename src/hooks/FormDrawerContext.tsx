import { createContext, useContext } from 'react'
import type { Transaction } from '../domain/types'

export type FormDrawer = {
  bukaBaru: () => void
  bukaEdit: (tx: Transaction) => void
}

export const FormDrawerContext = createContext<FormDrawer | null>(null)

/** Membuka form transaksi (drawer) dari mana saja: topbar, daftar, keadaan kosong. */
export function useFormDrawer(): FormDrawer {
  const v = useContext(FormDrawerContext)
  if (!v) throw new Error('useFormDrawer harus dipakai di dalam FormDrawerContext')
  return v
}
