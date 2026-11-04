import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  brokerDipakai,
  buatIdBroker,
  cariBroker,
  namaBroker,
  namaPendekBroker,
} from '../domain/brokers'
import type { BrokerConfig } from '../domain/types'
import { usePenyimpanan } from './RepositoryContext'
import { useTransactions } from './TransactionsContext'

type DataBrokerBaru = Omit<BrokerConfig, 'id'>

type Nilai = {
  daftar: BrokerConfig[]
  /** Broker yang punya transaksi, urut sesuai daftar — untuk filter & panel. */
  dipakai: string[]
  memuat: boolean
  cari: (id: string) => BrokerConfig | undefined
  nama: (id: string) => string
  namaPendek: (id: string) => string
  /** id dibentuk dari nama (ADR 001). Melempar error kalau id kosong atau sudah ada. */
  tambah: (b: DataBrokerBaru) => Promise<BrokerConfig>
  ubah: (id: string, patch: Partial<DataBrokerBaru>) => Promise<void>
  /** Melempar error kalau broker masih punya transaksi. */
  hapus: (id: string) => Promise<void>
  jumlahTransaksi: (id: string) => number
  muatUlang: () => Promise<void>
}

const Ctx = createContext<Nilai | null>(null)

/** Daftar broker milik pengguna. Harus berada di dalam TransactionsProvider. */
export function BrokersProvider({ children }: { children: ReactNode }) {
  const repo = usePenyimpanan().broker
  const { transaksi } = useTransactions()
  const [daftar, setDaftar] = useState<BrokerConfig[]>([])
  const [memuat, setMemuat] = useState(true)

  const muatUlang = useCallback(async () => {
    setDaftar(await repo.getAll())
  }, [repo])

  useEffect(() => {
    let batal = false
    repo
      .getAll()
      .then((d) => {
        if (!batal) setDaftar(d)
      })
      .finally(() => {
        if (!batal) setMemuat(false)
      })
    return () => {
      batal = true
    }
  }, [repo])

  const jumlahTransaksi = useCallback(
    (id: string) => transaksi.filter((t) => t.broker === id).length,
    [transaksi],
  )

  const tambah = useCallback(
    async (b: DataBrokerBaru) => {
      const id = buatIdBroker(b.nama)
      if (!id) throw new Error('Nama broker harus mengandung huruf atau angka')
      if (cariBroker(daftar, id)) throw new Error(`Broker dengan id ${id} sudah ada`)
      const baru = await repo.add({ ...b, id })
      await muatUlang()
      return baru
    },
    [repo, daftar, muatUlang],
  )

  const ubah = useCallback(
    async (id: string, patch: Partial<DataBrokerBaru>) => {
      await repo.update(id, patch)
      await muatUlang()
    },
    [repo, muatUlang],
  )

  const hapus = useCallback(
    async (id: string) => {
      const n = jumlahTransaksi(id)
      if (n > 0) throw new Error(`Broker masih dipakai ${n} transaksi — hapus transaksinya dulu`)
      await repo.remove(id)
      await muatUlang()
    },
    [repo, jumlahTransaksi, muatUlang],
  )

  const dipakai = useMemo(() => brokerDipakai(daftar, transaksi), [daftar, transaksi])

  const nilai = useMemo<Nilai>(
    () => ({
      daftar,
      dipakai,
      memuat,
      cari: (id) => cariBroker(daftar, id),
      nama: (id) => namaBroker(daftar, id),
      namaPendek: (id) => namaPendekBroker(daftar, id),
      tambah,
      ubah,
      hapus,
      jumlahTransaksi,
      muatUlang,
    }),
    [daftar, dipakai, memuat, tambah, ubah, hapus, jumlahTransaksi, muatUlang],
  )
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBrokers(): Nilai {
  const v = useContext(Ctx)
  if (!v) throw new Error('useBrokers harus dipakai di dalam <BrokersProvider>')
  return v
}
