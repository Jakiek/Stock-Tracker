import { useCallback } from 'react'
import { kosongkanData, muatDataContoh } from '../data/seed'
import { usePrices } from './PricesContext'
import { useRepository } from './RepositoryContext'
import { useTransactions } from './TransactionsContext'

/** Aksi "Muat data contoh" dan "Kosongkan data" — mengganti transaksi DAN harga. */
export function useDataContoh() {
  const repo = useRepository()
  const { muatUlang } = useTransactions()
  const prices = usePrices()

  const muat = useCallback(async () => {
    await muatDataContoh(repo)
    await muatUlang()
    prices.muatUlang()
  }, [repo, muatUlang, prices])

  const kosongkan = useCallback(async () => {
    await kosongkanData(repo)
    await muatUlang()
    prices.muatUlang()
  }, [repo, muatUlang, prices])

  return { muat, kosongkan }
}
