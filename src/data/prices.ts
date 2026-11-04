import type { KeyValueStorage } from './LocalStorageRepository'
import {
  cekHarga,
  type HargaPasar,
  type PetaHargaPasar,
  type PriceRepository,
} from './PriceRepository'

export type { HargaPasar } from './PriceRepository'

export const KUNCI_HARGA = 'saham-tracker:harga:v1'

/** Harga pasar di localStorage (mode lokal / tamu). */
export class LocalStoragePriceRepository implements PriceRepository {
  private readonly storage: KeyValueStorage
  private readonly sekarang: () => Date

  constructor(storage: KeyValueStorage, sekarang: () => Date = () => new Date()) {
    this.storage = storage
    this.sekarang = sekarang
  }

  async getAll(): Promise<PetaHargaPasar> {
    return this.baca()
  }

  async simpan(ticker: string, harga: number): Promise<HargaPasar> {
    cekHarga(harga)
    const baru: HargaPasar = { harga, diperbarui: this.sekarang().toISOString() }
    this.tulis({ ...this.baca(), [ticker]: baru })
    return baru
  }

  async hapus(ticker: string): Promise<void> {
    const semua = this.baca()
    delete semua[ticker]
    this.tulis(semua)
  }

  async replaceAll(peta: Record<string, number>, diperbarui: string): Promise<void> {
    const isi: PetaHargaPasar = {}
    for (const [t, h] of Object.entries(peta)) isi[t] = { harga: h, diperbarui }
    this.tulis(isi)
  }

  private baca(): PetaHargaPasar {
    try {
      const mentah = this.storage.getItem(KUNCI_HARGA)
      if (!mentah) return {}
      return saringHarga(JSON.parse(mentah))
    } catch {
      return {}
    }
  }

  private tulis(isi: PetaHargaPasar): void {
    this.storage.setItem(KUNCI_HARGA, JSON.stringify(isi))
  }
}

/** Membuang entri yang bentuknya tidak valid — data dari luar selalu `unknown`. */
export function saringHarga(data: unknown): PetaHargaPasar {
  if (typeof data !== 'object' || data === null) return {}
  const hasil: PetaHargaPasar = {}
  for (const [ticker, v] of Object.entries(data)) {
    if (
      typeof v === 'object' &&
      v !== null &&
      'harga' in v &&
      'diperbarui' in v &&
      typeof v.harga === 'number' &&
      Number.isInteger(v.harga) &&
      typeof v.diperbarui === 'string'
    ) {
      hasil[ticker] = { harga: v.harga, diperbarui: v.diperbarui }
    }
  }
  return hasil
}
