import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ambilHarga, simpanHarga, type HargaPasar } from '../data/prices'
import type { PetaHarga } from '../domain/portfolio'
import { useTransactions } from './TransactionsContext'

type Nilai = {
  /** ticker → harga + kapan diperbarui */
  harga: Readonly<Record<string, HargaPasar>>
  /** ticker → harga saja, bentuk yang dipakai domain/portfolio */
  petaHarga: PetaHarga
  simpan: (ticker: string, harga: number) => Promise<void>
  muatUlang: () => void
}

const Ctx = createContext<Nilai | null>(null)

export function PricesProvider({ children }: { children: ReactNode }) {
  const { transaksi } = useTransactions()
  const kunci = useMemo(
    () => [...new Set(transaksi.map((t) => t.ticker))].sort().join(','),
    [transaksi],
  )
  const [harga, setHarga] = useState<Record<string, HargaPasar>>({})
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    let batal = false
    const tickers = kunci ? kunci.split(',') : []
    // Semua harga dibaca lewat SATU pintu: ambilHarga().
    Promise.all(tickers.map(async (t) => [t, await ambilHarga(t)] as const)).then((hasil) => {
      if (batal) return
      const isi: Record<string, HargaPasar> = {}
      for (const [t, h] of hasil) if (h) isi[t] = h
      setHarga(isi)
    })
    return () => {
      batal = true
    }
  }, [kunci, versi])

  const simpan = useCallback(async (ticker: string, h: number) => {
    await simpanHarga(ticker, h)
    setVersi((v) => v + 1)
  }, [])

  const muatUlang = useCallback(() => setVersi((v) => v + 1), [])

  const petaHarga = useMemo(() => {
    const p: Record<string, number> = {}
    for (const [t, h] of Object.entries(harga)) p[t] = h.harga
    return p
  }, [harga])

  const nilai = useMemo(
    () => ({ harga, petaHarga, simpan, muatUlang }),
    [harga, petaHarga, simpan, muatUlang],
  )
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrices(): Nilai {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePrices harus dipakai di dalam <PricesProvider>')
  return v
}
