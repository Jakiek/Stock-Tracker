import type { BrokerConfig } from '../domain/types'

/**
 * Kontrak penyimpanan daftar broker (ADR 001). Async seperti TransactionRepository,
 * supaya implementasi API bisa menggantikannya tanpa mengubah komponen.
 */
export interface BrokerRepository {
  /** Urutan = urutan yang ditentukan pengguna (urutan penambahan). */
  getAll(): Promise<BrokerConfig[]>
  /** Melempar error kalau id sudah dipakai. */
  add(broker: BrokerConfig): Promise<BrokerConfig>
  /** id tidak bisa diubah — transaksi merujuk ke id. */
  update(id: string, patch: Partial<Omit<BrokerConfig, 'id'>>): Promise<BrokerConfig>
  /** Pemanggil wajib memastikan broker tidak punya transaksi (lihat BrokersContext). */
  remove(id: string): Promise<void>
}
