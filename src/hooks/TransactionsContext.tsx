import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { periksaRiwayat } from '../domain/positions'
import type { Transaction, TransaksiBaru } from '../domain/types'
import { useRepository } from './RepositoryContext'

type Nilai = {
  transaksi: Transaction[]
  memuat: boolean
  galat: string | null
  tambah: (tx: TransaksiBaru) => Promise<Transaction>
  ubah: (id: string, tx: TransaksiBaru) => Promise<Transaction>
  hapus: (id: string) => Promise<void>
  gantiSemua: (txs: TransaksiBaru[]) => Promise<void>
  /** Cek apakah riwayat tetap konsisten bila tx ditambah/diubah. null = aman. */
  cekSebelumSimpan: (tx: TransaksiBaru, idLama?: string) => string | null
}

const Ctx = createContext<Nilai | null>(null)

/**
 * Satu-satunya pemegang state transaksi di UI. Membungkus repository; tidak
 * menyimpan posisi — posisi selalu diturunkan oleh usePositions().
 */
export function TransactionsProvider({
  children,
  sebelumMuat,
}: {
  children: ReactNode
  /** Dijalankan sekali sebelum data pertama dibaca (mis. memuat data contoh). */
  sebelumMuat?: () => Promise<void>
}) {
  const repo = useRepository()
  const [transaksi, setTransaksi] = useState<Transaction[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState<string | null>(null)

  const muatUlang = useCallback(async () => {
    try {
      setTransaksi(await repo.getAll())
      setGalat(null)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e))
    }
  }, [repo])

  useEffect(() => {
    let batal = false
    ;(async () => {
      try {
        if (sebelumMuat) await sebelumMuat()
        const semua = await repo.getAll()
        if (!batal) setTransaksi(semua)
      } catch (e) {
        if (!batal) setGalat(e instanceof Error ? e.message : String(e))
      } finally {
        if (!batal) setMemuat(false)
      }
    })()
    return () => {
      batal = true
    }
  }, [repo, sebelumMuat])

  const tambah = useCallback(
    async (tx: TransaksiBaru) => {
      const baru = await repo.add(tx)
      await muatUlang()
      return baru
    },
    [repo, muatUlang],
  )

  const ubah = useCallback(
    async (id: string, tx: TransaksiBaru) => {
      // Field opsional yang dikosongkan harus ikut terhapus.
      const patch: Partial<Transaction> = {
        rasio: undefined,
        jumlah: undefined,
        tesis: undefined,
        catatan: undefined,
        ...tx,
      }
      const hasil = await repo.update(id, patch)
      await muatUlang()
      return hasil
    },
    [repo, muatUlang],
  )

  const hapus = useCallback(
    async (id: string) => {
      await repo.remove(id)
      await muatUlang()
    },
    [repo, muatUlang],
  )

  const gantiSemua = useCallback(
    async (txs: TransaksiBaru[]) => {
      await repo.replaceAll(txs)
      await muatUlang()
    },
    [repo, muatUlang],
  )

  const cekSebelumSimpan = useCallback(
    (tx: TransaksiBaru, idLama?: string) => {
      const kandidat: Transaction[] = idLama
        ? transaksi.map((t) => (t.id === idLama ? { ...t, ...tx } : t))
        : [...transaksi, { ...tx, id: '__baru__', dibuatPada: new Date().toISOString() }]
      return periksaRiwayat(kandidat)
    },
    [transaksi],
  )

  const nilai = useMemo(
    () => ({ transaksi, memuat, galat, tambah, ubah, hapus, gantiSemua, cekSebelumSimpan }),
    [transaksi, memuat, galat, tambah, ubah, hapus, gantiSemua, cekSebelumSimpan],
  )

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactions(): Nilai {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTransactions harus dipakai di dalam <TransactionsProvider>')
  return v
}
