import { useMemo } from 'react'
import { rp, rpBertanda } from '../domain/money'
import { rasioTerhadapModal, realizedSejak } from '../domain/portfolio'
import { usePreferences } from '../hooks/PreferencesContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { usePortfolio } from '../hooks/usePositions'
import { Pnl, TrendPill } from './ui/Pnl'
import { StatCard } from './ui/StatCard'

function warnaPnl(n: number) {
  return n > 0 ? 'text-gain' : n < 0 ? 'text-loss' : 'text-muted'
}

/** Baris KPI dashboard. Satu angka utama: nilai portofolio. */
export function PortfolioSummary() {
  const { ringkasan: r } = usePortfolio()
  const { transaksi } = useTransactions()
  const { pref } = usePreferences()

  const awalTahun = `${new Date().getFullYear()}-01-01`
  const realizedYtd = useMemo(() => realizedSejak(transaksi, awalTahun), [transaksi, awalTahun])

  const unreal = pref.setelahBiaya ? r.unrealizedBersih : r.unrealized

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-5">
      <StatCard
        size="lg"
        icon="wallet"
        label="Nilai portofolio"
        className="sm:col-span-2 lg:col-span-1"
        value={rp(r.nilai)}
        pill={<TrendPill rasio={rasioTerhadapModal(unreal, r.modal)} label="dari modal" />}
        sub={<span>{r.jumlahPosisi} posisi terbuka</span>}
      />
      <StatCard
        icon="coins"
        label="Modal"
        value={rp(r.modal)}
        sub={<span>termasuk fee beli</span>}
      />
      <StatCard
        icon="trendUp"
        label={pref.setelahBiaya ? 'Unrealized (setelah biaya)' : 'Unrealized'}
        value={<span className={warnaPnl(unreal)}>{rpBertanda(unreal)}</span>}
        sub={
          pref.setelahBiaya ? (
            <span>sudah dikurangi fee jual + PPh 0,1%</span>
          ) : (
            <span>
              setelah biaya: <Pnl nilai={r.unrealizedBersih} />
            </span>
          )
        }
      />
      <StatCard
        icon="check"
        label={`Realized ${new Date().getFullYear()}`}
        value={<span className={warnaPnl(realizedYtd)}>{rpBertanda(realizedYtd)}</span>}
        sub={
          <span>
            sepanjang waktu <Pnl nilai={r.realized} /> · dividen {rp(r.dividen)}
          </span>
        }
      />
    </div>
  )
}
