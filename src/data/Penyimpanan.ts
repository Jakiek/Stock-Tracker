import type { BrokerRepository } from './BrokerRepository'
import { LocalStorageBrokerRepository } from './LocalStorageBrokerRepository'
import { LocalStorageRepository, type KeyValueStorage } from './LocalStorageRepository'
import type { PriceRepository } from './PriceRepository'
import { LocalStoragePriceRepository } from './prices'
import type { TransactionRepository } from './TransactionRepository'

/**
 * Semua repository yang dipakai aplikasi, dipilih bersama di src/main.tsx:
 * lokal (localStorage, mode tamu) atau API (akun, sinkron antarperangkat).
 */
export interface Penyimpanan {
  jenis: 'lokal' | 'api'
  transaksi: TransactionRepository
  broker: BrokerRepository
  harga: PriceRepository
}

export function buatPenyimpananLokal(storage: KeyValueStorage = window.localStorage): Penyimpanan {
  return {
    jenis: 'lokal',
    transaksi: new LocalStorageRepository(storage),
    broker: new LocalStorageBrokerRepository(storage),
    harga: new LocalStoragePriceRepository(storage),
  }
}
