import { useEffect, useState } from 'react'

export interface Coords { lat: number; lng: number }
/** Midtown Manhattan: used when location is unavailable or denied. */
export const NYC_CENTER: Coords = { lat: 40.7549, lng: -73.984 }

export type GeoState = { coords: Coords; source: 'device' | 'fallback' | 'pending' }

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>(() => ({
    coords: NYC_CENTER,
    source: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'pending' : 'fallback',
  }))
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (p) => setState({ coords: { lat: p.coords.latitude, lng: p.coords.longitude }, source: 'device' }),
      () => setState({ coords: NYC_CENTER, source: 'fallback' }),
      { timeout: 4000, maximumAge: 60_000 },
    )
  }, [])
  return state
}
