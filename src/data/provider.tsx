import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Repos } from './interfaces'
import { createRepos } from './createRepos'

const ReposContext = createContext<Repos | null>(null)

export function DataProvider({ repos, children }: { repos?: Repos; children: ReactNode }) {
  const value = useMemo(() => repos ?? createRepos(), [repos])
  const client = useMemo(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }), [])
  return (
    <ReposContext.Provider value={value}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ReposContext.Provider>
  )
}

export function useRepos(): Repos {
  const r = useContext(ReposContext)
  if (!r) throw new Error('useRepos must be used inside <DataProvider>')
  return r
}
