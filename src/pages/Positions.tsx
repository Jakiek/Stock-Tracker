import { PositionTable } from '../components/PositionTable'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { useFormDrawer } from '../hooks/FormDrawerContext'
import { usePortfolio } from '../hooks/usePositions'
import { posisiTerbuka } from '../domain/portfolio'

export function Positions({ onKeHarga }: { onKeHarga: () => void }) {
  const { baris } = usePortfolio()
  const { bukaBaru } = useFormDrawer()

  if (posisiTerbuka(baris).length === 0) {
    return (
      <Card>
        <EmptyState
          icon="briefcase"
          title="Belum ada posisi terbuka"
          action={
            <Button variant="primary" icon="plus" onClick={bukaBaru}>
              Catat pembelian
            </Button>
          }
        >
          Posisi muncul otomatis dari transaksi beli — dipisah per broker, karena BBCA di BIONS dan
          BBCA di Stockbit punya harga rata-rata sendiri-sendiri.
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card padded={false} className="pt-4">
      <PositionTable onKeHarga={onKeHarga} />
      <p className="border-t border-border px-5 py-3 text-[12.5px] text-muted">
        Avg ditulis miring karena ia nilai turunan (modal ÷ lembar), bukan angka yang disimpan.
        Baris total menjumlahkan nilai — tidak pernah merata-ratakan harga lintas broker.
      </p>
    </Card>
  )
}
