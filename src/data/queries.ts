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

export function useLists() {
  const { lists } = useRepos()
  return useQuery({ queryKey: ['lists'], queryFn: () => lists.lists() })
}

export function useAllListItems() {
  const { lists } = useRepos()
  return useQuery({ queryKey: ['listItems'], queryFn: () => lists.items() })
}
