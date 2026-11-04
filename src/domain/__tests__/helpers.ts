import type { Transaction } from '../types'

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
