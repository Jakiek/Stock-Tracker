import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { RepositoryProvider } from './hooks/RepositoryContext'
import { buatPenyimpananLokal, type Penyimpanan } from './data/Penyimpanan'

// SATU-SATUNYA tempat implementasi repository dipilih.
const repo: Penyimpanan = buatPenyimpananLokal()

// Mempermudah eksperimen dari console browser saat pengembangan:
//   await repo.add({...}); await repo.getAll()
if (import.meta.env.DEV) {
  Object.assign(window, { repo })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepositoryProvider value={repo}>
      <App />
    </RepositoryProvider>
  </StrictMode>,
)
