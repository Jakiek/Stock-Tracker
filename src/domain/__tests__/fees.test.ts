import { describe, expect, it } from 'vitest'
import { hitungBiaya } from '../fees'
import { tarif } from './helpers'

// Memakai tarif broker AWAL (src/config/brokers.ts).
// BIONS: 0,17% beli, 0,17% + PPh 0,1% jual. Stockbit: 0,15% / 0,15% + 0,1%.

describe('hitungBiaya — config nyata', () => {
  it('BELI di BIONS: fee 0,17%, tanpa pajak', () => {
    expect(hitungBiaya(10_000_000, tarif('BIONS'), 'BELI')).toEqual({ fee: 17_000, pajak: 0 })
  })

  it('JUAL di BIONS: fee 0,17% + PPh final 0,1% = total 0,27%', () => {
    const { fee, pajak } = hitungBiaya(10_000_000, tarif('BIONS'), 'JUAL')
    expect(fee).toBe(17_000)
    expect(pajak).toBe(10_000)
    expect(fee + pajak).toBe(27_000)
  })

  it('JUAL di Stockbit: total 0,25%', () => {
    const { fee, pajak } = hitungBiaya(2_000_000, tarif('STOCKBIT'), 'JUAL')
    expect(fee + pajak).toBe(5_000)
  })

  it('hasil selalu bilangan bulat rupiah', () => {
    // 1.234.567 × 0,0017 = 2.098,7639 → 2.099 ; × 0,001 = 1.234,567 → 1.235
    expect(hitungBiaya(1_234_567, tarif('BIONS'), 'JUAL')).toEqual({ fee: 2099, pajak: 1235 })
  })
})
