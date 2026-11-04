/*
 * Preferensi tampilan per perangkat (tema, kerapatan tabel, toggle).
 * Bukan data keuangan — cukup localStorage, dan aman kalau storage tidak tersedia.
 */

export type Tema = 'light' | 'dark' | 'system'
export type Kerapatan = 'nyaman' | 'rapat'

export type Preferensi = {
  tema: Tema
  kerapatan: Kerapatan
  setelahBiaya: boolean
}

const AWALAN = 'saham-tracker:'

function baca(kunci: string): string | null {
  try {
    return window.localStorage.getItem(AWALAN + kunci)
  } catch {
    return null
  }
}

function tulis(kunci: string, nilai: string | null): void {
  try {
    if (nilai === null) window.localStorage.removeItem(AWALAN + kunci)
    else window.localStorage.setItem(AWALAN + kunci, nilai)
  } catch {
    /* storage tidak tersedia — preferensi tidak disimpan */
  }
}

export function bacaPreferensi(): Preferensi {
  const tema = baca('tema')
  const kerapatan = baca('kerapatan')
  return {
    tema: tema === 'light' || tema === 'dark' ? tema : 'system',
    kerapatan: kerapatan === 'rapat' ? 'rapat' : 'nyaman',
    setelahBiaya: baca('setelah-biaya') === '1',
  }
}

export function simpanPreferensi(p: Preferensi): void {
  tulis('tema', p.tema === 'system' ? null : p.tema)
  tulis('kerapatan', p.kerapatan)
  tulis('setelah-biaya', p.setelahBiaya ? '1' : '0')
}

/** Penanda bahwa aplikasi pernah dibuka di perangkat ini (untuk data contoh otomatis). */
export function sudahPernahDibuka(): boolean {
  return baca('sudah-dibuka') === '1'
}

export function tandaiSudahDibuka(): void {
  tulis('sudah-dibuka', '1')
}
