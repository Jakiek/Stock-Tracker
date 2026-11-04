import { useState, type ReactNode } from 'react'
import type { Tema } from '../data/preferences'
import { usePreferences } from '../hooks/PreferencesContext'
import type { Rute } from '../hooks/useRoute'
import { Button, IconButton } from './ui/Button'
import { Icon, type IconName } from './ui/Icon'

export type ItemNav = { rute: Rute; label: string; icon: IconName; grup: string }

const TEMA_BERIKUT: Record<Tema, Tema> = { system: 'light', light: 'dark', dark: 'system' }
const TEMA_IKON: Record<Tema, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' }
const TEMA_LABEL: Record<Tema, string> = {
  system: 'Tema: ikut sistem',
  light: 'Tema: terang',
  dark: 'Tema: gelap',
}

function Nav({
  items,
  aktif,
  onPilih,
  ciut,
}: {
  items: ItemNav[]
  aktif: Rute
  onPilih: (r: Rute) => void
  ciut: boolean
}) {
  const grup = [...new Set(items.map((i) => i.grup))]
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-5">
      {grup.map((g) => (
        <div key={g}>
          <p
            className={`mb-1.5 px-3 text-[11px] font-semibold tracking-[.08em] text-subtle uppercase ${ciut ? 'md:max-lg:sr-only' : ''}`}
          >
            {g}
          </p>
          <ul className="flex flex-col gap-0.5">
            {items
              .filter((i) => i.grup === g)
              .map((i) => {
                const sini = i.rute === aktif
                return (
                  <li key={i.rute}>
                    <a
                      href={`#/${i.rute}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onPilih(i.rute)
                      }}
                      aria-current={sini ? 'page' : undefined}
                      title={i.label}
                      className={`flex h-10 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors ${
                        sini
                          ? 'bg-accent-bg text-accent'
                          : 'text-muted hover:bg-surface-sunk hover:text-text'
                      } ${ciut ? 'md:max-lg:justify-center md:max-lg:px-0' : ''}`}
                    >
                      <Icon name={i.icon} />
                      <span className={ciut ? 'md:max-lg:sr-only' : ''}>{i.label}</span>
                    </a>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Logo({ ciut }: { ciut: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent text-white">
        <Icon name="trendUp" size={18} />
      </div>
      <span className={`text-[15px] font-bold tracking-tight ${ciut ? 'md:max-lg:sr-only' : ''}`}>
        Tracker Saham
      </span>
    </div>
  )
}

export function Layout({
  items,
  aktif,
  onPilih,
  judul,
  onTambah,
  topbar,
  children,
}: {
  items: ItemNav[]
  aktif: Rute
  onPilih: (r: Rute) => void
  judul: string
  onTambah: () => void
  /** Elemen tambahan di topbar, mis. status sinkron. */
  topbar?: ReactNode
  children: ReactNode
}) {
  const { pref, ubahPref } = usePreferences()
  const [laci, setLaci] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface focus:p-2"
      >
        Lompat ke konten
      </a>

      {/* Sidebar: 240px di lg, ciut ikon di md, laci di sm */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[60px] flex-col gap-6 border-r border-border bg-surface py-4 md:flex lg:w-[240px] lg:px-3">
        <div className="flex h-8 items-center justify-center lg:justify-start">
          <Logo ciut />
        </div>
        <div className="px-1.5 lg:px-0">
          <Nav items={items} aktif={aktif} onPilih={onPilih} ciut />
        </div>
      </aside>

      {laci && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setLaci(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col gap-6 bg-surface p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <Logo ciut={false} />
              <IconButton icon="x" label="Tutup menu" onClick={() => setLaci(false)} />
            </div>
            <Nav
              items={items}
              aktif={aktif}
              onPilih={(r) => {
                setLaci(false)
                onPilih(r)
              }}
              ciut={false}
            />
          </aside>
        </div>
      )}

      <div className="md:pl-[60px] lg:pl-[240px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <IconButton
            icon="menu"
            label="Buka menu"
            className="md:hidden"
            onClick={() => setLaci(true)}
          />
          <h1 className="min-w-0 flex-1 truncate text-[20px] leading-tight font-bold sm:text-[22px]">
            {judul}
          </h1>
          {topbar}
          <IconButton
            icon={TEMA_IKON[pref.tema]}
            label={`${TEMA_LABEL[pref.tema]} — klik untuk ganti`}
            onClick={() => ubahPref({ tema: TEMA_BERIKUT[pref.tema] })}
          />
          <Button
            variant="primary"
            icon="plus"
            onClick={onTambah}
            className="max-sm:w-10 max-sm:px-0"
          >
            <span className="max-sm:sr-only">Transaksi</span>
          </Button>
        </header>
        <main id="konten" className="mx-auto max-w-[1440px] px-4 py-5 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
