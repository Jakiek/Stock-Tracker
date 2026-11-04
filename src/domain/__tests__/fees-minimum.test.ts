import { describe, expect, it } from 'vitest'
import { hitungBiaya } from '../fees'
import { tarif } from './helpers'

/*
 * Kasus uji #10 — fee minimum.
 * Kedua broker awal TIDAK punya fee minimum, tapi logika Math.max harus
 * terbukti benar kalau suatu saat ada. Karena tarif kini argumen hitungBiaya(),
 * cukup buat tarif dengan minimum — tidak perlu memalsukan modul config.
 */
const STOCKBIT_MIN = { ...tarif('STOCKBIT'), feeBeli: 0.0015, feeJual: 0.0015, feeMinimum: 5000 }

describe('#10 fee minimum aktif', () => {
  it('transaksi kecil ditagih minimum, bukan persentase', () => {
    // 1.000.000 × 0,15% = 1.500 → ditagih 5.000 (tarif efektif 0,50%)
    const { fee } = hitungBiaya(1_000_000, STOCKBIT_MIN, 'BELI')
    expect(fee).toBe(5000)
    expect(fee / 1_000_000).toBeCloseTo(0.005, 10)
  })

  it('transaksi besar memakai persentase karena melewati minimum', () => {
    // 10.000.000 × 0,15% = 15.000 > 5.000
    expect(hitungBiaya(10_000_000, STOCKBIT_MIN, 'BELI').fee).toBe(15_000)
  })

  it('minimum berlaku untuk fee, bukan untuk PPh final', () => {
    const { fee, pajak } = hitungBiaya(1_000_000, STOCKBIT_MIN, 'JUAL')
    expect(fee).toBe(5000)
    expect(pajak).toBe(1000)
  })

  it('broker lain tidak terpengaruh', () => {
    expect(hitungBiaya(1_000_000, tarif('BIONS'), 'BELI').fee).toBe(1700)
  })
})
