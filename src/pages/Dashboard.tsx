import { useMemo } from 'react'
import { BrokerComparison } from '../components/BrokerComparison'
import { PortfolioSummary } from '../components/PortfolioSummary'
import { PositionTable } from '../components/PositionTable'
import { TransactionList } from '../components/TransactionList'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DonutChart } from '../components/ui/DonutChart'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { komposisi } from '../domain/portfolio'
import { useFormDrawer } from '../hooks/FormDrawerContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { usePortfolio } from '../hooks/usePositions'
import type { Rute } from '../hooks/useRoute'

function TautanKecil({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-semibold text-accent hover:underline"
    >
      {children}
    </button>
  )
}

export function Dashboard({
  pindah,
  onMuatContoh,
}: {
  pindah: (r: Rute) => void
  onMuatContoh?: () => void
}) {
  const { transaksi } = useTransactions()
  const { baris, ringkasan } = usePortfolio()
  const { bukaBaru } = useFormDrawer()
  const segmen = useMemo(() => komposisi(baris), [baris])

  if (transaksi.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="dashboard"
          title="Portofoliomu akan tampil di sini"
          action={
            onMuatContoh && (
              <Button variant="primary" onClick={onMuatContoh}>
                Muat data contoh
              </Button>
            )
          }
          secondary={
            <Button variant="secondary" icon="plus" onClick={bukaBaru}>
              Catat transaksi pertama
            </Button>
          }
        >
          Nilai portofolio, untung/rugi per broker, dan komposisi saham dihitung dari transaksi yang
          kamu catat. Coba dengan data contoh dulu — bisa dikosongkan kapan saja.
        </EmptyState>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {ringkasan.tickerTanpaHarga.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-warn/40 bg-warn-bg px-4 py-3 text-[13px] text-warn">
          <Icon name="alert" size={16} />
          <span>
            {ringkasan.tickerTanpaHarga.length} saham belum punya harga pasar (
            <span className="font-mono">{ringkasan.tickerTanpaHarga.join(', ')}</span>) — nilainya
            sementara memakai modal.
          </span>
          <TautanKecil onClick={() => pindah('harga')}>Isi harga →</TautanKecil>
        </div>
      )}

      <PortfolioSummary />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card
          title="Posisi teratas"
          className="lg:col-span-8"
          padded={false}
          action={<TautanKecil onClick={() => pindah('posisi')}>Semua posisi →</TautanKecil>}
        >
          <PositionTable ringkas batas={6} onKeHarga={() => pindah('harga')} />
        </Card>
        <Card title="Komposisi" className="lg:col-span-4">
          {segmen.length > 0 ? (
            <DonutChart data={segmen} total={ringkasan.nilai} />
          ) : (
            <p className="py-8 text-center text-muted">Belum ada posisi terbuka.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card
          title="Transaksi terbaru"
          className="lg:col-span-7"
          padded={false}
          action={<TautanKecil onClick={() => pindah('transaksi')}>Semua transaksi →</TautanKecil>}
        >
          <TransactionList ringkas batas={6} />
        </Card>
        <Card title="BIONS vs Stockbit" className="lg:col-span-5">
          <BrokerComparison />
          <p className="mt-3 text-[12.5px] text-muted">
            Realized sudah dikurangi seluruh fee & pajak. Baris biaya menunjukkan berapa yang
            tergerus.
          </p>
        </Card>
      </div>
    </div>
  )
}
