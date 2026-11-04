import { useCallback, useEffect, useState } from 'react'
import { salinPenyimpanan } from '../data/salin'
import { useBrokers } from './BrokersContext'
import { usePrices } from './PricesContext'
import { usePenyimpanan } from './RepositoryContext'
import { useSesi } from './SesiContext'
import { useTransactions } from './TransactionsContext'

/** Memindahkan data mode tamu (browser ini) ke akun yang sedang masuk. */
export function usePindahData() {
  const { penyimpananLokal } = useSesi()
  const tujuan = usePenyimpanan()
  const { muatUlang } = useTransactions()
  const brokers = useBrokers()
  const prices = usePrices()
  const [jumlahLokal, setJumlahLokal] = useState<number | null>(null)

  useEffect(() => {
    penyimpananLokal.transaksi
      .getAll()
      .then((t) => setJumlahLokal(t.length))
      .catch(() => setJumlahLokal(0))
  }, [penyimpananLokal])

  const pindahkan = useCallback(async () => {
    const n = await salinPenyimpanan(penyimpananLokal, tujuan)
    await brokers.muatUlang()
    await muatUlang()
    prices.muatUlang()
    return n
  }, [penyimpananLokal, tujuan, brokers, muatUlang, prices])

  return { jumlahLokal, pindahkan, bisa: tujuan.jenis === 'api' }
}
