import type { JenisTransaksi } from '../domain/types'

/** Label tampilan untuk jenis transaksi. */
export const JENIS_LABEL: Record<JenisTransaksi, string> = {
  BELI: 'Beli',
  JUAL: 'Jual',
  DIVIDEN_TUNAI: 'Dividen tunai',
  SPLIT: 'Stock split',
  REVERSE_SPLIT: 'Reverse split',
  RIGHTS: 'Rights issue',
  DIVIDEN_SAHAM: 'Dividen saham',
}

export const JENIS_PENDEK: Record<JenisTransaksi, string> = {
  BELI: 'Beli',
  JUAL: 'Jual',
  DIVIDEN_TUNAI: 'Dividen',
  SPLIT: 'Split',
  REVERSE_SPLIT: 'R-split',
  RIGHTS: 'Rights',
  DIVIDEN_SAHAM: 'Div. saham',
}
