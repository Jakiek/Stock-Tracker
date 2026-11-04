import type { ReactNode } from 'react'
import { Card } from '../components/ui/Card'
import { Segmented } from '../components/ui/Segmented'
import { BROKERS, DAFTAR_BROKER } from '../config/brokers'
import type { Kerapatan, Tema } from '../data/preferences'
import { persen, rp } from '../domain/money'
import { usePreferences } from '../hooks/PreferencesContext'

function Baris({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0">
      <div>
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

export function Settings({ dataSection }: { dataSection?: ReactNode }) {
  const { pref, ubahPref } = usePreferences()

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card title="Tampilan">
        <Baris label="Tema" hint="Ikut sistem mengikuti pengaturan perangkat.">
          <Segmented<Tema>
            label="Tema"
            value={pref.tema}
            onChange={(tema) => ubahPref({ tema })}
            options={[
              { value: 'system', label: 'Sistem' },
              { value: 'light', label: 'Terang' },
              { value: 'dark', label: 'Gelap' },
            ]}
          />
        </Baris>
        <Baris label="Kerapatan tabel" hint="Rapat menampilkan lebih banyak baris sekaligus.">
          <Segmented<Kerapatan>
            label="Kerapatan tabel"
            value={pref.kerapatan}
            onChange={(kerapatan) => ubahPref({ kerapatan })}
            options={[
              { value: 'nyaman', label: 'Nyaman' },
              { value: 'rapat', label: 'Rapat' },
            ]}
          />
        </Baris>
        <Baris label="Unrealized setelah biaya" hint="Kurangi fee jual + PPh final dari unrealized P/L.">
          <input
            type="checkbox"
            aria-label="Unrealized setelah biaya"
            checked={pref.setelahBiaya}
            onChange={(e) => ubahPref({ setelahBiaya: e.target.checked })}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </Baris>
      </Card>

      <Card title="Tarif broker">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] tracking-[.08em] text-muted uppercase">
              <th scope="col" className="pb-2 text-left font-semibold">Broker</th>
              <th scope="col" className="num pb-2 font-semibold">Beli</th>
              <th scope="col" className="num pb-2 font-semibold">Jual</th>
              <th scope="col" className="num pb-2 font-semibold">PPh</th>
              <th scope="col" className="num pb-2 font-semibold">Minimum</th>
            </tr>
          </thead>
          <tbody>
            {DAFTAR_BROKER.map((b) => {
              const c = BROKERS[b]
              return (
                <tr key={b} className="border-t border-border">
                  <th scope="row" className="py-2.5 text-left font-semibold">{c.nama}</th>
                  <td className="num py-2.5">{persen(c.feeBeli, 2)}</td>
                  <td className="num py-2.5">{persen(c.feeJual, 2)}</td>
                  <td className="num py-2.5">{persen(c.pphFinal, 2)}</td>
                  <td className="num py-2.5">{c.feeMinimum ? rp(c.feeMinimum) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-3 rounded-control bg-warn-bg p-3 text-[12.5px] text-warn">
          Tarif ini hanya mengisi nilai awal fee di form. Fee yang tersimpan di tiap transaksi tidak
          berubah walau tarif diganti. Tarif belum diverifikasi dengan konfirmasi transaksi asli.
        </p>
      </Card>

      {dataSection}
    </div>
  )
}
