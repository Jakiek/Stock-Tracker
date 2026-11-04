import { useEffect } from 'react'
import { useBrokers } from './BrokersContext'
import { usePrices } from './PricesContext'
import { usePenyimpanan } from './RepositoryContext'
import { useTransactions } from './TransactionsContext'

/**
 * Sinkron sederhana: saat tab kembali aktif (mis. pindah dari laptop ke HP lalu kembali),
 * muat ulang data dari server. Hanya untuk mode akun — mode tamu tidak berubah dari luar.
 */
export function useMuatUlangSaatKembali(): void {
  const { jenis } = usePenyimpanan()
  const { muatUlang } = useTransactions()
  const { muatUlang: muatBroker } = useBrokers()
  const { muatUlang: muatHarga } = usePrices()

  useEffect(() => {
    if (jenis !== 'api') return
    const saatTerlihat = () => {
      if (document.visibilityState !== 'visible') return
      void muatBroker().catch(() => {})
      void muatUlang()
      muatHarga()
    }
    document.addEventListener('visibilitychange', saatTerlihat)
    return () => document.removeEventListener('visibilitychange', saatTerlihat)
  }, [jenis, muatUlang, muatBroker, muatHarga])
}
