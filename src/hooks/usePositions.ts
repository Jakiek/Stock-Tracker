import { useMemo } from 'react'
import {
  hitungBarisSemua,
  hitungRingkasan,
  type BarisPosisi,
  type RingkasanPortofolio,
} from '../domain/portfolio'
import { hitungPosisi } from '../domain/positions'
import type { Position } from '../domain/types'
import { usePrices } from './PricesContext'
import { useTransactions } from './TransactionsContext'

/**
 * Posisi SELALU diturunkan dari transaksi — tidak pernah disimpan.
 * Hook ini hanya menjalankan hitungPosisi() atas hasil useTransactions().
 */
export function usePositions(): { posisi: Position[]; galat: string | null } {
  const { transaksi } = useTransactions()
  return useMemo(() => {
    try {
      return { posisi: hitungPosisi(transaksi), galat: null }
    } catch (e) {
      return { posisi: [], galat: e instanceof Error ? e.message : String(e) }
    }
  }, [transaksi])
}

/** Posisi + harga pasar → baris tabel & ringkasan portofolio. */
export function usePortfolio(): {
  posisi: Position[]
  baris: BarisPosisi[]
  ringkasan: RingkasanPortofolio
  galat: string | null
} {
  const { posisi, galat } = usePositions()
  const { petaHarga } = usePrices()
  return useMemo(
    () => ({
      posisi,
      baris: hitungBarisSemua(posisi, petaHarga),
      ringkasan: hitungRingkasan(posisi, petaHarga),
      galat,
    }),
    [posisi, petaHarga, galat],
  )
}
