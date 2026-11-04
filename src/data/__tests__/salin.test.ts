import { describe, expect, it } from 'vitest'
import type { KeyValueStorage } from '../LocalStorageRepository'
import { buatPenyimpananLokal } from '../Penyimpanan'
import { salinPenyimpanan } from '../salin'
import { buatDataContoh, HARGA_CONTOH } from '../seed'

function storagePalsu(): KeyValueStorage {
  const isi = new Map<string, string>()
  return { getItem: (k) => isi.get(k) ?? null, setItem: (k, v) => void isi.set(k, v) }
}

describe('salinPenyimpanan', () => {
  it('memindahkan broker tambahan, transaksi (urutan terjaga), dan harga', async () => {
    const dari = buatPenyimpananLokal(storagePalsu())
    const ke = buatPenyimpananLokal(storagePalsu())
    await dari.broker.add({
      id: 'AJAIB',
      nama: 'Ajaib',
      feeBeli: 0.001,
      feeJual: 0.001,
      feeMinimum: 0,
      pphFinal: 0.001,
    })
    await dari.transaksi.replaceAll(buatDataContoh())
    await dari.harga.replaceAll(HARGA_CONTOH, '2026-11-03T09:00:00.000Z')

    const n = await salinPenyimpanan(dari, ke)
    expect(n).toBe(buatDataContoh().length)
    expect((await ke.broker.getAll()).map((b) => b.id)).toContain('AJAIB')
    const asal = await dari.transaksi.getAll()
    const hasil = await ke.transaksi.getAll()
    const tanpaId = (t: (typeof asal)[number]) => ({ ...t, id: '', dibuatPada: '' })
    expect(hasil.map(tanpaId)).toEqual(asal.map(tanpaId))
    expect(Object.keys(await ke.harga.getAll()).sort()).toEqual(Object.keys(HARGA_CONTOH).sort())
  })
})
