import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { cekSesi, type Akun } from './data/auth'
import { pasangPenanganSesiBerakhir } from './data/http'
import { buatPenyimpananApi, buatPenyimpananLokal, type Penyimpanan } from './data/Penyimpanan'
import { RepositoryProvider } from './hooks/RepositoryContext'
import { SesiProvider } from './hooks/SesiContext'

const lokal: Penyimpanan = buatPenyimpananLokal()

/**
 * SATU-SATUNYA tempat implementasi repository dipilih:
 *  - belum masuk (mode tamu)  → localStorage, data contoh dimuat saat pertama dibuka
 *  - sudah masuk              → REST API, data sinkron antarperangkat
 * Komponen tidak tahu bedanya — keduanya memenuhi interface yang sama (keputusan #6).
 */
// eslint-disable-next-line react-refresh/only-export-components
function Akar() {
  const [akun, setAkun] = useState<Akun | null | undefined>(undefined)

  useEffect(() => {
    pasangPenanganSesiBerakhir(() => setAkun(null))
    cekSesi().then(setAkun)
    return () => pasangPenanganSesiBerakhir(null)
  }, [])

  const penyimpanan = useMemo(() => (akun ? buatPenyimpananApi() : lokal), [akun])

  // Mempermudah eksperimen dari console browser saat pengembangan.
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { repo: penyimpanan })
  }, [penyimpanan])

  if (akun === undefined) {
    return <p className="py-20 text-center text-muted">Memuat…</p>
  }

  return (
    <SesiProvider akun={akun} onUbahAkun={setAkun} penyimpananLokal={lokal}>
      {/* key: ganti mode = pasang ulang seluruh state, tidak ada data tamu yang bocor ke akun */}
      <RepositoryProvider key={akun?.email ?? 'tamu'} value={penyimpanan}>
        <App />
      </RepositoryProvider>
    </SesiProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Akar />
  </StrictMode>,
)
