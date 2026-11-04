import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { RepositoryProvider } from './hooks/RepositoryContext'
import type { TransactionRepository } from './data/TransactionRepository'
import { LocalStorageRepository } from './data/LocalStorageRepository'

// SATU-SATUNYA tempat implementasi repository dipilih.
// fase 6:  const repo = new ApiRepository(import.meta.env.VITE_API_URL)
const repo: TransactionRepository = new LocalStorageRepository()

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
