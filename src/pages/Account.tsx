import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/Field'
import { Segmented } from '../components/ui/Segmented'
import { useSesi } from '../hooks/SesiContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { usePindahData } from '../hooks/usePindahData'

type Mode = 'masuk' | 'daftar'

function FormMasuk() {
  const { masuk, daftar } = useSesi()
  const [mode, setMode] = useState<Mode>('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [galat, setGalat] = useState<string | null>(null)
  const [proses, setProses] = useState(false)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalat(null)
    setProses(true)
    try {
      await (mode === 'masuk' ? masuk : daftar)(email, password)
    } catch (err) {
      setGalat(err instanceof Error ? err.message : String(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <form onSubmit={kirim} className="flex max-w-sm flex-col gap-4">
      <Segmented<Mode>
        label="Masuk atau daftar"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'masuk', label: 'Masuk' },
          { value: 'daftar', label: 'Buat akun' },
        ]}
      />
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        label="Kata sandi"
        type="password"
        autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={mode === 'daftar' ? 'Minimal 8 karakter.' : undefined}
      />
      {galat && (
        <p role="alert" className="text-[13px] text-loss">
          {galat}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={proses}>
        {proses ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Buat akun'}
      </Button>
    </form>
  )
}

function PindahData() {
  const { jumlahLokal, pindahkan } = usePindahData()
  const { transaksi } = useTransactions()
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  if (!jumlahLokal) return null

  async function jalankan() {
    if (transaksi.length > 0 && !konfirmasi) {
      setKonfirmasi(true)
      return
    }
    setKonfirmasi(false)
    try {
      const n = await pindahkan()
      setPesan(`${n} transaksi dipindahkan ke akun.`)
    } catch (e) {
      setPesan(`Gagal: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <Card title="Data di browser ini">
      <p className="text-[13px] text-muted">
        Browser ini menyimpan {jumlahLokal} transaksi dari mode tamu. Pindahkan ke akun supaya ikut
        tersinkron. Broker tambahan dan harga pasar ikut dipindahkan.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant={konfirmasi ? 'danger' : 'secondary'} onClick={jalankan}>
          {konfirmasi
            ? `Timpa ${transaksi.length} transaksi di akun?`
            : `Pindahkan ${jumlahLokal} transaksi ke akun`}
        </Button>
        {konfirmasi && (
          <Button variant="ghost" onClick={() => setKonfirmasi(false)}>
            Batal
          </Button>
        )}
      </div>
      {pesan && <p className="mt-3 text-[12.5px] text-muted">{pesan}</p>}
    </Card>
  )
}

export function Account() {
  const { akun, keluar } = useSesi()

  if (!akun) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Masuk untuk sinkron">
          <p className="mb-5 text-[13px] text-muted">
            Saat ini kamu memakai <strong>mode tamu</strong>: data hanya tersimpan di browser ini.
            Masuk atau buat akun supaya transaksi tersimpan di server dan sama di HP maupun laptop.
          </p>
          <FormMasuk />
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card title="Akun">
        <p className="text-[13px] text-muted">Masuk sebagai</p>
        <p className="mt-1 font-semibold">{akun.email}</p>
        <p className="mt-3 text-[13px] text-muted">
          Data tersimpan di server dan tersinkron ke semua perangkat yang masuk dengan akun ini.
          Perubahan dari perangkat lain muncul saat aplikasi dibuka atau tab kembali aktif.
        </p>
        <div className="mt-4">
          <Button onClick={keluar}>Keluar</Button>
        </div>
      </Card>
      <PindahData />
    </div>
  )
}
