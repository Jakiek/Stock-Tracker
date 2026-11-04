import { TransactionList } from '../components/TransactionList'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { useFormDrawer } from '../hooks/FormDrawerContext'
import { useTransactions } from '../hooks/TransactionsContext'

export function Transactions({ onMuatContoh }: { onMuatContoh?: () => void }) {
  const { transaksi } = useTransactions()
  const { bukaBaru } = useFormDrawer()

  if (transaksi.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="list"
          title="Belum ada transaksi"
          action={
            <Button variant="primary" icon="plus" onClick={bukaBaru}>
              Tambah transaksi
            </Button>
          }
          secondary={
            onMuatContoh && (
              <Button variant="secondary" onClick={onMuatContoh}>
                Muat data contoh
              </Button>
            )
          }
        >
          Setiap beli, jual, dividen, dan corporate action dicatat di sini. Posisi dan P/L dihitung
          ulang dari daftar ini.
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card padded={false} className="pt-4">
      <TransactionList />
    </Card>
  )
}
