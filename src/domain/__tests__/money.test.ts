import { describe, expect, it } from 'vitest'
import { bulat, formatLot, keLot, persen, persenBertanda, rp, rpBertanda, rpDesimal } from '../money'

describe('money', () => {
  it('bulat tidak menghasilkan -0', () => {
    expect(Object.is(bulat(-0.2), 0)).toBe(true)
    expect(bulat(2.5)).toBe(3)
  })

  it('format rupiah Indonesia: titik 3-3-3, tanpa desimal (bukan lakh India)', () => {
    expect(rp(8_980_450)).toBe('Rp8.980.450')
    expect(rp(0)).toBe('Rp0')
    expect(rp(-340_000)).toBe('−Rp340.000')
  })

  it('bentuk ringkas memakai koma desimal Indonesia', () => {
    expect(rp(1_400_000, { ringkas: true })).toBe('Rp1,4 jt')
    expect(rp(2_500_000_000, { ringkas: true })).toBe('Rp2,5 M')
    expect(rp(12_000, { ringkas: true })).toBe('Rp12 rb')
  })

  it('P/L selalu bertanda eksplisit, nol netral', () => {
    expect(rpBertanda(1_240_000)).toBe('+Rp1.240.000')
    expect(rpBertanda(-340_000)).toBe('−Rp340.000')
    expect(rpBertanda(0)).toBe('Rp0')
    expect(persenBertanda(0.082)).toBe('+8,2%')
    expect(persenBertanda(-0.021)).toBe('−2,1%')
  })

  it('persen dengan presisi pilihan', () => {
    expect(persen(0.0027, 2)).toBe('0,27%')
    expect(persen(0.082)).toBe('8,2%')
  })

  it('avg dua desimal', () => {
    expect(rpDesimal(9233.5)).toBe('9.233,50')
  })

  it('lot tidak pernah pecahan; sisa lembar ditampilkan terpisah', () => {
    expect(keLot(1200)).toEqual({ lot: 12, sisa: 0 })
    expect(formatLot(1200)).toBe('12 lot')
    expect(formatLot(37)).toBe('37 lbr')
    expect(formatLot(1250)).toBe('12 lot + 50 lbr')
  })
})
