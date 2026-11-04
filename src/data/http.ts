/** Galat dari API, membawa status HTTP. 401 berarti sesi berakhir. */
export class GalatHttp extends Error {
  readonly status: number
  constructor(status: number, pesan: string) {
    super(pesan)
    this.status = status
  }
}

/** Dipanggil sekali saat API menjawab 401 — aplikasi kembali ke layar masuk. */
let saatSesiBerakhir: (() => void) | null = null
export function pasangPenanganSesiBerakhir(fn: (() => void) | null): void {
  saatSesiBerakhir = fn
}

/**
 * fetch JSON ke API di domain yang sama. Cookie sesi ikut otomatis (same-origin).
 * `undefined` di body dikirim sebagai `null`, supaya field opsional yang dikosongkan
 * benar-benar terhapus di server (JSON tidak mengenal undefined).
 */
export async function minta<T>(metode: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: metode,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body, (_k, v: unknown) => (v === undefined ? null : v)),
    })
  } catch {
    throw new GalatHttp(0, 'Tidak bisa terhubung ke server. Periksa koneksi internet.')
  }
  if (res.status === 204) return undefined as T
  const teks = await res.text()
  let data: unknown = null
  try {
    data = teks ? JSON.parse(teks) : null
  } catch {
    /* bukan JSON (mis. halaman galat proxy) */
  }
  if (!res.ok) {
    if (res.status === 401) saatSesiBerakhir?.()
    const pesan =
      typeof data === 'object' && data !== null && 'galat' in data && typeof data.galat === 'string'
        ? data.galat
        : `Server menjawab ${res.status}`
    throw new GalatHttp(res.status, pesan)
  }
  return data as T
}
