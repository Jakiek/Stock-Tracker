import { useCallback, useMemo, useState } from 'react'
import { DataSettings } from './components/DataSettings'
import { Layout, type ItemNav } from './components/Layout'
import { TransactionForm } from './components/TransactionForm'
import { Drawer } from './components/ui/Drawer'
import { Icon } from './components/ui/Icon'
import { muatContohSaatPertamaDibuka } from './data/seed'
import type { Transaction } from './domain/types'
import { BrokersProvider } from './hooks/BrokersContext'
import { FormDrawerContext } from './hooks/FormDrawerContext'
import { PreferencesProvider } from './hooks/PreferencesContext'
import { PricesProvider } from './hooks/PricesContext'
import { TransactionsProvider, useTransactions } from './hooks/TransactionsContext'
import { useDataContoh } from './hooks/useDataContoh'
import { useSesi } from './hooks/SesiContext'
import { useMuatUlangSaatKembali } from './hooks/useMuatUlangSaatKembali'
import { usePositions } from './hooks/usePositions'
import { useRoute, type Rute } from './hooks/useRoute'
import { Dashboard } from './pages/Dashboard'
import { Positions } from './pages/Positions'
import { Prices } from './pages/Prices'
import { Reconcile } from './pages/Reconcile'
import { Account } from './pages/Account'
import { Settings } from './pages/Settings'
import { Transactions } from './pages/Transactions'

const NAV: ItemNav[] = [
  { rute: 'dashboard', label: 'Dashboard', icon: 'dashboard', grup: 'Umum' },
  { rute: 'transaksi', label: 'Transaksi', icon: 'list', grup: 'Umum' },
  { rute: 'posisi', label: 'Posisi', icon: 'briefcase', grup: 'Umum' },
  { rute: 'harga', label: 'Harga pasar', icon: 'tag', grup: 'Alat' },
  { rute: 'rekonsiliasi', label: 'Rekonsiliasi', icon: 'scale', grup: 'Alat' },
  { rute: 'akun', label: 'Akun & sinkron', icon: 'user', grup: 'Lainnya' },
  { rute: 'pengaturan', label: 'Pengaturan', icon: 'settings', grup: 'Lainnya' },
]

const JUDUL: Record<Rute, string> = {
  dashboard: 'Dashboard',
  transaksi: 'Transaksi',
  posisi: 'Posisi',
  harga: 'Harga pasar',
  rekonsiliasi: 'Rekonsiliasi',
  pengaturan: 'Pengaturan',
  akun: 'Akun & sinkron',
}

function Isi() {
  const [rute, pindah] = useRoute()
  const { memuat, galat } = useTransactions()
  const { galat: galatPosisi } = usePositions()
  const { muat: muatContoh } = useDataContoh()
  const { akun } = useSesi()
  useMuatUlangSaatKembali()
  const [drawer, setDrawer] = useState<{ open: boolean; tx?: Transaction }>({ open: false })

  const form = useMemo(
    () => ({
      bukaBaru: () => setDrawer({ open: true }),
      bukaEdit: (tx: Transaction) => setDrawer({ open: true, tx }),
    }),
    [],
  )
  const tutup = useCallback(() => setDrawer({ open: false }), [])

  const halaman = (() => {
    switch (rute) {
      case 'dashboard':
        return <Dashboard pindah={pindah} onMuatContoh={muatContoh} />
      case 'transaksi':
        return <Transactions onMuatContoh={muatContoh} />
      case 'posisi':
        return <Positions onKeHarga={() => pindah('harga')} />
      case 'harga':
        return <Prices />
      case 'rekonsiliasi':
        return <Reconcile />
      case 'pengaturan':
        return <Settings dataSection={<DataSettings />} />
      case 'akun':
        return <Account />
    }
  })()

  return (
    <FormDrawerContext.Provider value={form}>
      <Layout
        items={NAV}
        aktif={rute}
        onPilih={pindah}
        judul={JUDUL[rute]}
        onTambah={form.bukaBaru}
        topbar={
          <button
            type="button"
            onClick={() => pindah('akun')}
            title={
              akun ? `Tersinkron sebagai ${akun.email}` : 'Mode tamu — data hanya di browser ini'
            }
            className="flex h-9 max-w-[180px] items-center gap-1.5 rounded-control px-2 text-[12.5px] font-semibold text-muted hover:bg-surface-sunk"
          >
            <Icon name={akun ? 'cloud' : 'user'} size={16} />
            <span className="truncate max-sm:sr-only">{akun ? akun.email : 'Mode tamu'}</span>
          </button>
        }
      >
        {(galat || galatPosisi) && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-card border border-warn bg-warn-bg p-4 text-[13px] text-warn"
          >
            <Icon name="alert" className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Data transaksi tidak konsisten</p>
              <p>{galat ?? galatPosisi}</p>
            </div>
          </div>
        )}
        {memuat ? <p className="py-20 text-center text-muted">Memuat…</p> : halaman}
      </Layout>
      <Drawer
        open={drawer.open}
        onClose={tutup}
        title={drawer.tx ? 'Ubah transaksi' : 'Tambah transaksi'}
      >
        <TransactionForm
          key={drawer.tx?.id ?? 'baru'}
          awal={drawer.tx}
          onSelesai={tutup}
          onBatal={tutup}
        />
      </Drawer>
    </FormDrawerContext.Provider>
  )
}

export default function App() {
  return (
    <PreferencesProvider>
      <TransactionsProvider sebelumMuat={muatContohSaatPertamaDibuka}>
        <BrokersProvider>
          <PricesProvider>
            <Isi />
          </PricesProvider>
        </BrokersProvider>
      </TransactionsProvider>
    </PreferencesProvider>
  )
}
