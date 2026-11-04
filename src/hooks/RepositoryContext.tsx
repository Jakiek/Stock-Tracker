import { createContext, useContext, type ReactNode } from 'react'
import type { TransactionRepository } from '../data/TransactionRepository'

const RepositoryContext = createContext<TransactionRepository | null>(null)

export function RepositoryProvider({
  value,
  children,
}: {
  value: TransactionRepository
  children: ReactNode
}) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRepository(): TransactionRepository {
  const repo = useContext(RepositoryContext)
  if (!repo) throw new Error('useRepository harus dipakai di dalam <RepositoryProvider>')
  return repo
}
