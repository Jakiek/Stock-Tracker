import { useCallback } from 'react'
import { kosongkanData, muatDataContoh } from '../data/seed'
import { usePrices } from './PricesContext'
import { useBrokers } from './BrokersContext'
import { usePenyimpanan } from './RepositoryContext'
import { useTransactions } from './TransactionsContext'

/** Aksi "Muat data contoh" dan "Kosongkan data" — mengganti transaksi DAN harga. */
export function useDataContoh() {
  const repo = usePenyimpanan()
  const brokers = useBrokers()
  const { muatUlang } = useTransactions()
  const prices = usePrices()

  const muat = useCallback(async () => {
    await muatDataContoh(repo)
    await brokers.muatUlang()
    await muatUlang()
    prices.muatUlang()
  }, [repo, muatUlang, prices, brokers])

  const kosongkan = useCallback(async () => {
    await kosongkanData(repo)
    await muatUlang()
    prices.muatUlang()
  }, [repo, muatUlang, prices])

  return { muat, kosongkan }
}
