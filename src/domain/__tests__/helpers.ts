import { BROKER_AWAL } from '../../config/brokers'
import { cariBroker, type DaftarBroker } from '../brokers'
import type { BrokerConfig, Transaction } from '../types'

let seri = 0

/**
 * Pembuat transaksi untuk test. `dibuatPada` otomatis naik sesuai urutan
 * pemanggilan, kecuali diisi eksplisit.
 */
export function tx(t: Partial<Transaction> & Pick<Transaction, 'jenis'>): Transaction {
  seri += 1
  return {
    id: `tx-${seri}`,
    tanggal: '2026-01-02',
    dibuatPada: new Date(Date.UTC(2026, 0, 1, 0, 0, seri)).toISOString(),
    broker: 'BIONS',
    ticker: 'BBCA',
    lembar: 0,
    harga: 0,
    fee: 0,
    pajak: 0,
    ...t,
  }
}

/** Daftar broker awal dari config — dipakai test yang butuh tarif nyata. */
export const DAFTAR_AWAL: DaftarBroker = BROKER_AWAL

export function tarif(id: string): BrokerConfig {
  const c = cariBroker(BROKER_AWAL, id)
  if (!c) throw new Error(`Broker ${id} tidak ada di BROKER_AWAL`)
  return c
}
