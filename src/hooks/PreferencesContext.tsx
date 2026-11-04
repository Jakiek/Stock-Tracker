import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { bacaPreferensi, simpanPreferensi, type Preferensi } from '../data/preferences'

type Nilai = {
  pref: Preferensi
  ubahPref: (patch: Partial<Preferensi>) => void
}

const Ctx = createContext<Nilai | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<Preferensi>(bacaPreferensi)

  // Tema tiga keadaan: light / dark / tanpa penanda (ikut sistem).
  useEffect(() => {
    const root = document.documentElement
    if (pref.tema === 'system') delete root.dataset.theme
    else root.dataset.theme = pref.tema
  }, [pref.tema])

  const ubahPref = useCallback((patch: Partial<Preferensi>) => {
    setPref((lama) => {
      const baru = { ...lama, ...patch }
      simpanPreferensi(baru)
      return baru
    })
  }, [])

  const nilai = useMemo(() => ({ pref, ubahPref }), [pref, ubahPref])
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): Nilai {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePreferences harus dipakai di dalam <PreferencesProvider>')
  return v
}
