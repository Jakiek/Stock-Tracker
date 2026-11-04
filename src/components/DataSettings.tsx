import { useState } from 'react'
import { useDataContoh } from '../hooks/useDataContoh'
import { useTransactions } from '../hooks/TransactionsContext'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

type Aksi = 'muat' | 'kosongkan'

/** Pengelolaan data: muat contoh, kosongkan, ekspor. Aksi yang menimpa data minta konfirmasi. */
export function DataSettings() {
  const { transaksi } = useTransactions()
  const { muat, kosongkan } = useDataContoh()
  const [konfirmasi, setKonfirmasi] = useState<Aksi | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)

  async function jalankan(a: Aksi) {
    if (transaksi.length > 0 && konfirmasi !== a) {
      setKonfirmasi(a)
      return
    }
    setKonfirmasi(null)
    if (a === 'muat') {
      await muat()
      setPesan('Data contoh dimuat.')
    } else {
      await kosongkan()
      setPesan('Semua transaksi dan harga dihapus.')
    }
  }

  function ekspor() {
    const blob = new Blob([JSON.stringify(transaksi, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaksi-${new Date().toLocaleDateString('sv-SE')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card title="Data" className="lg:col-span-2">
      <p className="text-[13px] text-muted">
        Data tersimpan di browser ini saja (localStorage). Tersimpan {transaksi.length} transaksi.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant={konfirmasi === 'muat' ? 'danger' : 'secondary'} onClick={() => jalankan('muat')}>
          {konfirmasi === 'muat' ? 'Timpa dengan data contoh?' : 'Muat data contoh'}
        </Button>
        <Button
          variant={konfirmasi === 'kosongkan' ? 'danger' : 'secondary'}
          onClick={() => jalankan('kosongkan')}
          disabled={transaksi.length === 0}
        >
          {konfirmasi === 'kosongkan' ? `Hapus ${transaksi.length} transaksi?` : 'Kosongkan data'}
        </Button>
        {konfirmasi && (
          <Button variant="ghost" onClick={() => setKonfirmasi(null)}>
            Batal
          </Button>
        )}
        <Button variant="ghost" onClick={ekspor} disabled={transaksi.length === 0} className="sm:ml-auto">
          Ekspor JSON
        </Button>
      </div>
      {konfirmasi && (
        <p className="mt-3 text-[12.5px] text-warn">
          Transaksi yang ada sekarang akan hilang. Ekspor dulu kalau ingin menyimpannya.
        </p>
      )}
      {pesan && !konfirmasi && (
        <p role="status" className="mt-3 text-[12.5px] text-muted">
          {pesan}
        </p>
      )}
    </Card>
  )
}
