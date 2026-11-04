import { describe, expect, it, vi } from 'vitest'
import { hitungBiaya } from '../fees'

/*
 * Kasus uji #10 — fee minimum.
 * Kedua broker saat ini TIDAK punya fee minimum, tapi logika Math.max harus
 * terbukti benar kalau suatu saat ada. Config dipalsukan khusus di file ini;
 * signature hitungBiaya() tidak diubah.
 */
vi.mock('../../config/brokers', async (importAsli) => {
  const asli = await importAsli<typeof import('../../config/brokers')>()
  return {
    ...asli,
    BROKERS: {
      ...asli.BROKERS,
      STOCKBIT: { ...asli.BROKERS.STOCKBIT, feeBeli: 0.0015, feeJual: 0.0015, feeMinimum: 5000 },
    },
  }
})

describe('#10 fee minimum aktif', () => {
  it('transaksi kecil ditagih minimum, bukan persentase', () => {
    // 1.000.000 × 0,15% = 1.500 → ditagih 5.000 (tarif efektif 0,50%)
    const { fee } = hitungBiaya(1_000_000, 'STOCKBIT', 'BELI')
    expect(fee).toBe(5000)
    expect(fee / 1_000_000).toBeCloseTo(0.005, 10)
  })

  it('transaksi besar memakai persentase karena melewati minimum', () => {
    // 10.000.000 × 0,15% = 15.000 > 5.000
    expect(hitungBiaya(10_000_000, 'STOCKBIT', 'BELI').fee).toBe(15_000)
  })

  it('minimum berlaku untuk fee, bukan untuk PPh final', () => {
    const { fee, pajak } = hitungBiaya(1_000_000, 'STOCKBIT', 'JUAL')
    expect(fee).toBe(5000)
    expect(pajak).toBe(1000)
  })

  it('broker lain tidak terpengaruh', () => {
    expect(hitungBiaya(1_000_000, 'BIONS', 'BELI').fee).toBe(1700)
  })
})
