import { useCallback, useSyncExternalStore } from 'react'

/*
 * Navigasi berbasis hash (#/transaksi) — tanpa menambah dependensi router,
 * dan tidak butuh konfigurasi rewrite di Vercel.
 */

export const RUTE = ['dashboard', 'transaksi', 'posisi', 'harga', 'rekonsiliasi', 'pengaturan'] as const
export type Rute = (typeof RUTE)[number]

function baca(): Rute {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (RUTE as readonly string[]).includes(h) ? (h as Rute) : 'dashboard'
}

function langganan(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): [Rute, (r: Rute) => void] {
  const rute = useSyncExternalStore(langganan, baca, () => 'dashboard' as Rute)
  const pindah = useCallback((r: Rute) => {
    window.location.hash = `/${r}`
    window.scrollTo({ top: 0 })
  }, [])
  return [rute, pindah]
}
