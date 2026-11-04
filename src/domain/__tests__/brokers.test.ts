import { describe, expect, it } from 'vitest'
import {
  brokerDipakai,
  buatIdBroker,
  namaBroker,
  namaPendekBroker,
  persenDariTarif,
  tarifDariPersen,
} from '../brokers'
import { DAFTAR_AWAL } from './helpers'

describe('broker', () => {
  it('id dibentuk dari nama: huruf besar, alfanumerik, maks 12', () => {
    expect(buatIdBroker('Ajaib')).toBe('AJAIB')
    expect(buatIdBroker('Mirae Asset')).toBe('MIRAEASSET')
    expect(buatIdBroker('IPOT (Indo Premier)')).toBe('IPOTINDOPREM')
    expect(buatIdBroker('  ')).toBe('')
  })

  it('nama tampilan; id tak dikenal tampil apa adanya', () => {
    expect(namaBroker(DAFTAR_AWAL, 'BIONS')).toBe('BIONS (BNI)')
    expect(namaPendekBroker(DAFTAR_AWAL, 'BIONS')).toBe('BIONS')
    expect(namaBroker(DAFTAR_AWAL, 'HILANG')).toBe('HILANG')
  })

  it('broker dipakai: urut sesuai daftar, broker asing di akhir', () => {
    const txs = [
      { broker: 'ZETA' },
      { broker: 'STOCKBIT' },
      { broker: 'ALFA' },
      { broker: 'STOCKBIT' },
    ]
    expect(brokerDipakai(DAFTAR_AWAL, txs)).toEqual(['STOCKBIT', 'ALFA', 'ZETA'])
    expect(brokerDipakai(DAFTAR_AWAL, [])).toEqual([])
  })

  it('tarif dari teks persen, tanpa galat floating point', () => {
    expect(tarifDariPersen('0,15')).toBe(0.0015)
    expect(tarifDariPersen('0.17')).toBe(0.0017)
    expect(tarifDariPersen('0,1')).toBe(0.001)
    expect(tarifDariPersen('abc')).toBeNull()
    expect(tarifDariPersen('-1')).toBeNull()
    expect(persenDariTarif(0.0015)).toBe('0,15')
    expect(persenDariTarif(0.001)).toBe('0,1')
  })
})
