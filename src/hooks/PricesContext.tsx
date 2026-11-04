import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { HargaPasar } from '../data/PriceRepository'
import type { PetaHarga } from '../domain/portfolio'
import { usePenyimpanan } from './RepositoryContext'
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
  const repo = usePenyimpanan().harga
  const kunci = useMemo(
    () => [...new Set(transaksi.map((t) => t.ticker))].sort().join(','),
    [transaksi],
  )
  const [harga, setHarga] = useState<Record<string, HargaPasar>>({})
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    let batal = false
    const tickers = kunci ? kunci.split(',') : []
    // Semua harga dibaca lewat SATU pintu: PriceRepository.getAll().
    repo
      .getAll()
      .then((semua) => {
        if (batal) return
        const isi: Record<string, HargaPasar> = {}
        for (const t of tickers) if (semua[t]) isi[t] = semua[t]
        setHarga(isi)
      })
      .catch(() => {
        /* gagal membaca harga: posisi tampil "tanpa harga", bukan crash */
      })
    return () => {
      batal = true
    }
  }, [repo, kunci, versi])

  const simpan = useCallback(
    async (ticker: string, h: number) => {
      await repo.simpan(ticker, h)
      setVersi((v) => v + 1)
    },
    [repo],
  )

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
