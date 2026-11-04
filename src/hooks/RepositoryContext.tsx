import { createContext, useContext, type ReactNode } from 'react'
import type { Penyimpanan } from '../data/Penyimpanan'
import type { TransactionRepository } from '../data/TransactionRepository'

const RepositoryContext = createContext<Penyimpanan | null>(null)

/** Penyimpanan dipilih di src/main.tsx lalu diteruskan lewat provider ini. */
export function RepositoryProvider({
  value,
  children,
}: {
  value: Penyimpanan
  children: ReactNode
}) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePenyimpanan(): Penyimpanan {
  const p = useContext(RepositoryContext)
  if (!p) throw new Error('usePenyimpanan harus dipakai di dalam <RepositoryProvider>')
  return p
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRepository(): TransactionRepository {
  return usePenyimpanan().transaksi
}
