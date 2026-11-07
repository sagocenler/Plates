import { useQuery } from '@tanstack/react-query'
import { useRepos } from './provider'

export function useVisits() {
  const { visits } = useRepos()
  return useQuery({ queryKey: ['visits'], queryFn: () => visits.list() })
}

export function usePlaces() {
  const { places } = useRepos()
  return useQuery({ queryKey: ['places'], queryFn: () => places.list() })
}
