import { useState, type FormEvent } from 'react'
import { PPH_FINAL_JUAL } from '../config/brokers'
import { buatIdBroker, persenDariTarif, tarifDariPersen } from '../domain/brokers'
import { persen, rp } from '../domain/money'
import type { BrokerConfig } from '../domain/types'
import { useBrokers } from '../hooks/BrokersContext'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { TextInput } from './ui/Field'

type Draf = { nama: string; feeBeli: string; feeJual: string; pph: string; minimum: string }

const KOSONG: Draf = {
  nama: '',
  feeBeli: '',
  feeJual: '',
  pph: persenDariTarif(PPH_FINAL_JUAL),
  minimum: '0',
}

function dariBroker(b: BrokerConfig): Draf {
  return {
    nama: b.nama,
    feeBeli: persenDariTarif(b.feeBeli),
    feeJual: persenDariTarif(b.feeJual),
    pph: persenDariTarif(b.pphFinal),
    minimum: String(b.feeMinimum),
  }
}

/** Kelola daftar broker: tambah, ubah tarif, hapus (hanya yang tanpa transaksi). */
export function BrokerSettings() {
  const brokers = useBrokers()
  const [edit, setEdit] = useState<string | null>(null) // id broker, '__baru__', atau null
  const [d, setD] = useState<Draf>(KOSONG)
  const [galat, setGalat] = useState<Partial<Record<keyof Draf | '_', string>>>({})
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)

  const set = (k: keyof Draf, v: string) => setD((x) => ({ ...x, [k]: v }))

  function buka(id: string | null) {
    setEdit(id)
    setGalat({})
    setPesan(null)
    const b = id && id !== '__baru__' ? brokers.cari(id) : undefined
    setD(b ? dariBroker(b) : KOSONG)
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    const g: typeof galat = {}
    const feeBeli = tarifDariPersen(d.feeBeli)
    const feeJual = tarifDariPersen(d.feeJual)
    const pphFinal = tarifDariPersen(d.pph)
    const feeMinimum = /^\d+$/.test(d.minimum.replace(/\./g, ''))
      ? Number(d.minimum.replace(/\./g, ''))
      : null
    if (!d.nama.trim()) g.nama = 'Nama broker wajib diisi'
    if (feeBeli === null) g.feeBeli = 'Isi persen, mis. 0,15'
    if (feeJual === null) g.feeJual = 'Isi persen, mis. 0,15'
    if (pphFinal === null) g.pph = 'Isi persen, mis. 0,1'
    if (feeMinimum === null) g.minimum = 'Rupiah bilangan bulat, 0 kalau tidak ada'
    if (
      Object.keys(g).length ||
      feeBeli === null ||
      feeJual === null ||
      pphFinal === null ||
      feeMinimum === null
    ) {
      setGalat(g)
      return
    }
    const data = { nama: d.nama.trim(), feeBeli, feeJual, pphFinal, feeMinimum }
    try {
      if (edit === '__baru__') {
        const b = await brokers.tambah(data)
        setPesan(`${b.nama} ditambahkan.`)
      } else if (edit) {
        await brokers.ubah(edit, data)
        setPesan('Tarif diperbarui. Transaksi lama tidak berubah.')
      }
      setEdit(null)
    } catch (err) {
      setGalat({ _: err instanceof Error ? err.message : String(err) })
    }
  }

  async function hapus(id: string) {
    if (konfirmasiHapus !== id) {
      setKonfirmasiHapus(id)
      return
    }
    setKonfirmasiHapus(null)
    try {
      await brokers.hapus(id)
      setPesan('Broker dihapus.')
    } catch (err) {
      setPesan(err instanceof Error ? err.message : String(err))
    }
  }

  const idBaru = edit === '__baru__' ? buatIdBroker(d.nama) : null

  return (
    <Card
      title="Broker & tarif"
      action={
        edit === null && (
          <Button size="sm" icon="plus" onClick={() => buka('__baru__')}>
            Tambah broker
          </Button>
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] tracking-[.08em] text-muted uppercase">
              <th scope="col" className="pb-2 text-left font-semibold">
                Broker
              </th>
              <th scope="col" className="num pb-2 font-semibold">
                Beli
              </th>
              <th scope="col" className="num pb-2 font-semibold">
                Jual
              </th>
              <th scope="col" className="num pb-2 font-semibold">
                PPh
              </th>
              <th scope="col" className="num pb-2 font-semibold">
                Min.
              </th>
              <th scope="col" className="pb-2">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {brokers.daftar.map((c) => {
              const n = brokers.jumlahTransaksi(c.id)
              return (
                <tr key={c.id} className="border-t border-border">
                  <th scope="row" className="py-2.5 pr-2 text-left font-semibold">
                    {c.nama}
                    <span className="block text-[11.5px] font-normal text-muted">
                      {n} transaksi
                    </span>
                  </th>
                  <td className="num py-2.5">{persen(c.feeBeli, 2)}</td>
                  <td className="num py-2.5">{persen(c.feeJual, 2)}</td>
                  <td className="num py-2.5">{persen(c.pphFinal, 2)}</td>
                  <td className="num py-2.5">{c.feeMinimum ? rp(c.feeMinimum) : '—'}</td>
                  <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="text-[12.5px] font-semibold text-accent hover:underline"
                      onClick={() => buka(c.id)}
                    >
                      Ubah
                    </button>
                    {n === 0 && (
                      <button
                        type="button"
                        className="ml-3 text-[12.5px] font-semibold text-loss hover:underline"
                        onClick={() => hapus(c.id)}
                      >
                        {konfirmasiHapus === c.id ? 'Yakin?' : 'Hapus'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {edit !== null && (
        <form
          onSubmit={simpan}
          noValidate
          className="mt-4 flex flex-col gap-3 rounded-control border border-border bg-surface-sunk p-4"
        >
          <p className="font-semibold">
            {edit === '__baru__' ? 'Broker baru' : `Ubah ${brokers.nama(edit)}`}
          </p>
          <TextInput
            label="Nama broker"
            value={d.nama}
            maxLength={40}
            placeholder="mis. Ajaib"
            onChange={(e) => set('nama', e.target.value)}
            error={galat.nama}
            hint={idBaru ? `Id: ${idBaru} — tidak bisa diubah setelah disimpan.` : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Fee beli (%)"
              inputMode="decimal"
              value={d.feeBeli}
              placeholder="0,15"
              onChange={(e) => set('feeBeli', e.target.value)}
              error={galat.feeBeli}
            />
            <TextInput
              label="Fee jual (%)"
              inputMode="decimal"
              value={d.feeJual}
              placeholder="0,15"
              onChange={(e) => set('feeJual', e.target.value)}
              error={galat.feeJual}
              hint="Di luar PPh final."
            />
            <TextInput
              label="PPh final jual (%)"
              inputMode="decimal"
              value={d.pph}
              onChange={(e) => set('pph', e.target.value)}
              error={galat.pph}
            />
            <TextInput
              label="Fee minimum (Rp)"
              inputMode="numeric"
              value={d.minimum}
              onChange={(e) => set('minimum', e.target.value)}
              error={galat.minimum}
            />
          </div>
          {galat._ && <p className="text-[12.5px] text-loss">{galat._}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Simpan
            </Button>
            <Button type="button" size="sm" onClick={() => setEdit(null)}>
              Batal
            </Button>
          </div>
        </form>
      )}

      {pesan && <p className="mt-3 text-[12.5px] text-muted">{pesan}</p>}
      <p className="mt-3 rounded-control bg-warn-bg p-3 text-[12.5px] text-warn">
        Tarif hanya mengisi nilai awal fee di form. Fee yang tersimpan di tiap transaksi tidak
        berubah walau tarif diganti. Broker yang masih punya transaksi tidak bisa dihapus.
      </p>
    </Card>
  )
}
