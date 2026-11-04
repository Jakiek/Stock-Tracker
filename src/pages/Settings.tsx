import type { ReactNode } from 'react'
import { BrokerSettings } from '../components/BrokerSettings'
import { Card } from '../components/ui/Card'
import { Segmented } from '../components/ui/Segmented'
import type { Kerapatan, Tema } from '../data/preferences'
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
        <Baris
          label="Unrealized setelah biaya"
          hint="Kurangi fee jual + PPh final dari unrealized P/L."
        >
          <input
            type="checkbox"
            aria-label="Unrealized setelah biaya"
            checked={pref.setelahBiaya}
            onChange={(e) => ubahPref({ setelahBiaya: e.target.checked })}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </Baris>
      </Card>

      <BrokerSettings />

      {dataSection}
    </div>
  )
}
