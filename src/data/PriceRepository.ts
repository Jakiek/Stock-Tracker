/**
 * Harga pasar — diisi manual. SATU pintu baca: PriceRepository.getAll().
 * Harga disimpan per ticker (bukan per ticker+broker): harga BBCA sama di broker mana pun.
 */
export type HargaPasar = {
  harga: number // rupiah per lembar
  diperbarui: string // ISO datetime — angka portofolio hanya sebaik harga terakhir
}

export type PetaHargaPasar = Record<string, HargaPasar>

export interface PriceRepository {
  getAll(): Promise<PetaHargaPasar>
  simpan(ticker: string, harga: number): Promise<HargaPasar>
  hapus(ticker: string): Promise<void>
  /** Mengganti seluruh harga — dipakai data contoh & kosongkan data. */
  replaceAll(peta: Record<string, number>, diperbarui: string): Promise<void>
}

export function cekHarga(harga: number): void {
  if (!Number.isInteger(harga) || harga <= 0) throw new Error('Harga harus bilangan bulat positif')
}
