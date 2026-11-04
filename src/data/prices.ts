/*
 * Harga pasar. SATU pintu baca: ambilHarga().
 *
 * Fase 4: membaca input manual dari localStorage.
 * Fase 8: isi fungsi ini diganti panggilan API (GET /api/prices?tickers=...),
 * dan tidak ada tempat lain yang perlu diubah.
 */

export type HargaPasar = {
  harga: number // rupiah per lembar
  diperbarui: string // ISO datetime — angka portofolio hanya sebaik harga terakhir
}

const KUNCI = 'saham-tracker:harga:v1'

function bacaSemua(): Record<string, HargaPasar> {
  try {
    const mentah = window.localStorage.getItem(KUNCI)
    if (!mentah) return {}
    const data: unknown = JSON.parse(mentah)
    if (typeof data !== 'object' || data === null) return {}
    const hasil: Record<string, HargaPasar> = {}
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
  } catch {
    return {}
  }
}

function tulisSemua(isi: Record<string, HargaPasar>): void {
  window.localStorage.setItem(KUNCI, JSON.stringify(isi))
}

export async function ambilHarga(ticker: string): Promise<HargaPasar | null> {
  return bacaSemua()[ticker] ?? null
}

export async function simpanHarga(ticker: string, harga: number): Promise<HargaPasar> {
  if (!Number.isInteger(harga) || harga <= 0) throw new Error('Harga harus bilangan bulat positif')
  const semua = bacaSemua()
  const baru: HargaPasar = { harga, diperbarui: new Date().toISOString() }
  tulisSemua({ ...semua, [ticker]: baru })
  return baru
}

export async function hapusHarga(ticker: string): Promise<void> {
  const semua = bacaSemua()
  delete semua[ticker]
  tulisSemua(semua)
}

/** Mengganti seluruh harga — dipakai data contoh & kosongkan data. */
export async function gantiSemuaHarga(peta: Record<string, number>, diperbarui: string): Promise<void> {
  const isi: Record<string, HargaPasar> = {}
  for (const [t, h] of Object.entries(peta)) isi[t] = { harga: h, diperbarui }
  tulisSemua(isi)
}
