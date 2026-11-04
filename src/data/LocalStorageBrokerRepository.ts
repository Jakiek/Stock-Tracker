import { BROKER_AWAL } from '../config/brokers'
import { brokerConfigSchema, daftarBrokerSchema } from '../domain/schema'
import type { BrokerConfig } from '../domain/types'
import type { BrokerRepository } from './BrokerRepository'
import type { KeyValueStorage } from './LocalStorageRepository'

export const KUNCI_BROKER = 'saham-tracker:broker:v1'

/**
 * Daftar broker di localStorage. Kalau kunci belum ada (perangkat baru, atau data
 * dari sebelum ADR 001), daftar diisi BROKER_AWAL — data lama tetap terbaca.
 */
export class LocalStorageBrokerRepository implements BrokerRepository {
  private readonly storage: KeyValueStorage

  constructor(storage: KeyValueStorage) {
    this.storage = storage
  }

  async getAll(): Promise<BrokerConfig[]> {
    return this.baca()
  }

  async add(broker: BrokerConfig): Promise<BrokerConfig> {
    const valid = brokerConfigSchema.parse(broker)
    const semua = this.baca()
    if (semua.some((b) => b.id === valid.id)) {
      throw new Error(`Broker dengan id ${valid.id} sudah ada`)
    }
    this.tulis([...semua, valid])
    return valid
  }

  async update(id: string, patch: Partial<Omit<BrokerConfig, 'id'>>): Promise<BrokerConfig> {
    const semua = this.baca()
    const i = semua.findIndex((b) => b.id === id)
    if (i === -1) throw new Error(`Broker ${id} tidak ditemukan`)
    const hasil = brokerConfigSchema.parse({ ...semua[i], ...patch, id })
    const salinan = [...semua]
    salinan[i] = hasil
    this.tulis(salinan)
    return hasil
  }

  async remove(id: string): Promise<void> {
    this.tulis(this.baca().filter((b) => b.id !== id))
  }

  private baca(): BrokerConfig[] {
    const mentah = this.storage.getItem(KUNCI_BROKER)
    if (mentah === null) {
      const awal = BROKER_AWAL.map((b) => ({ ...b }))
      this.tulis(awal)
      return awal
    }
    const hasil = daftarBrokerSchema.safeParse(JSON.parse(mentah))
    if (!hasil.success) {
      throw new Error(`Data broker di localStorage tidak valid: ${hasil.error.message}`)
    }
    return hasil.data
  }

  private tulis(daftar: BrokerConfig[]): void {
    this.storage.setItem(KUNCI_BROKER, JSON.stringify(daftar))
  }
}
