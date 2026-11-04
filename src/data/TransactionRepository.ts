import type { Transaction, TransaksiBaru } from '../domain/types'

/**
 * Kontrak penyimpanan transaksi.
 *
 * SEMUA method async, walaupun localStorage sinkron. Disengaja: di fase 6
 * implementasinya diganti ApiRepository (fetch, pasti async) tanpa ada satu pun
 * komponen yang perlu berubah.
 */
export interface TransactionRepository {
  getAll(): Promise<Transaction[]>
  add(tx: TransaksiBaru): Promise<Transaction>
  update(id: string, patch: Partial<Transaction>): Promise<Transaction>
  remove(id: string): Promise<void>
  /** Mengganti seluruh isi — dipakai "Muat data contoh" & "Kosongkan data". */
  replaceAll(txs: TransaksiBaru[]): Promise<Transaction[]>
}
