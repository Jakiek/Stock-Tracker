import { daftarTransaksiSchema } from '../domain/schema'
import type { Transaction, TransaksiBaru } from '../domain/types'
import type { TransactionRepository } from './TransactionRepository'

/** Subset Storage yang dipakai — memungkinkan test tanpa memalsukan browser. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export const KUNCI_TRANSAKSI = 'saham-tracker:transaksi:v1'

export class LocalStorageRepository implements TransactionRepository {
  private readonly storage: KeyValueStorage
  private readonly kunci: string
  private readonly sekarang: () => Date

  constructor(
    storage: KeyValueStorage = window.localStorage,
    kunci: string = KUNCI_TRANSAKSI,
    sekarang: () => Date = () => new Date(),
  ) {
    this.storage = storage
    this.kunci = kunci
    this.sekarang = sekarang
  }

  async getAll(): Promise<Transaction[]> {
    return this.baca()
  }

  async add(tx: TransaksiBaru): Promise<Transaction> {
    const semua = this.baca()
    const baru: Transaction = { ...tx, id: crypto.randomUUID(), dibuatPada: this.cap(semua) }
    this.tulis([...semua, baru])
    return baru
  }

  async update(id: string, patch: Partial<Transaction>): Promise<Transaction> {
    const semua = this.baca()
    const i = semua.findIndex((t) => t.id === id)
    if (i === -1) throw new Error(`Transaksi ${id} tidak ditemukan`)
    // id dan dibuatPada tidak boleh diubah: dibuatPada adalah pemecah seri urutan.
    const hasil: Transaction = { ...semua[i], ...patch, id, dibuatPada: semua[i].dibuatPada }
    const salinan = [...semua]
    salinan[i] = hasil
    this.tulis(salinan)
    return hasil
  }

  async remove(id: string): Promise<void> {
    this.tulis(this.baca().filter((t) => t.id !== id))
  }

  async replaceAll(txs: TransaksiBaru[]): Promise<Transaction[]> {
    const hasil: Transaction[] = []
    for (const tx of txs) {
      hasil.push({ ...tx, id: crypto.randomUUID(), dibuatPada: this.cap(hasil) })
    }
    this.tulis(hasil)
    return hasil
  }

  /**
   * Cap waktu yang dijamin naik ketat, supaya dua transaksi yang ditambah dalam
   * milidetik yang sama tetap punya urutan deterministik.
   */
  private cap(yangAda: Transaction[]): string {
    let t = this.sekarang().getTime()
    for (const tx of yangAda) {
      const lain = Date.parse(tx.dibuatPada)
      if (!Number.isNaN(lain) && lain >= t) t = lain + 1
    }
    return new Date(t).toISOString()
  }

  private baca(): Transaction[] {
    const mentah = this.storage.getItem(this.kunci)
    if (mentah === null) return []
    const data: unknown = JSON.parse(mentah)
    const hasil = daftarTransaksiSchema.safeParse(data)
    if (!hasil.success) {
      throw new Error(`Data transaksi di localStorage tidak valid: ${hasil.error.message}`)
    }
    return hasil.data
  }

  private tulis(txs: Transaction[]): void {
    this.storage.setItem(this.kunci, JSON.stringify(txs))
  }
}
