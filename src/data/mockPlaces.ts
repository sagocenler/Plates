import type { PlaceSearchResult, PlacesProvider } from './interfaces'
import { NYC_CATALOG } from './seed/catalog'

type LatLng = { lat: number; lng: number }

export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '')

/** Stand-in for Google Places. Same interface, so the swap is a one-line change. */
export class MockPlacesProvider implements PlacesProvider {
  async autocomplete(query: string, near?: LatLng): Promise<PlaceSearchResult[]> {
    const q = norm(query).trim()
    if (!q) return []
    const hits = NYC_CATALOG.filter((p) => norm(`${p.name} ${p.neighborhood} ${p.cuisine}`).includes(q))
    return this.withDistance(hits, near).slice(0, 8)
  }

  async nearby(near: LatLng, limit = 5): Promise<PlaceSearchResult[]> {
    return this.withDistance(NYC_CATALOG, near).slice(0, limit)
  }

  private withDistance(list: PlaceSearchResult[], near?: LatLng): PlaceSearchResult[] {
    if (!near) return list
    return list
      .map((p) => ({ ...p, distanceMeters: distanceMeters(near, p) }))
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
  }
}
