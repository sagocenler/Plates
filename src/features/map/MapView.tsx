import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef } from 'react'
import { boundsOf } from '@/domain/geo'
import type { LibraryEntry } from '@/domain/filters'
import { representativeVisit } from '@/domain/share'
import { VERDICT_LABEL } from '@/domain/types'

// Vite needs the worker URL spelled out explicitly (the default lookup fails in dev and builds).
maplibregl.setWorkerUrl(workerUrl)

// Open raster tiles keep dev token-free. Swap for Mapbox/MapTiler/Google when you add a key.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

const COLOR = { loved: '#b4452c', liked: '#e07a5f', fine: '#8a8178', skip: '#bdb5aa' } as const

function styleSelected(el: HTMLElement, selected: boolean) {
  el.style.zIndex = selected ? '2' : '1'
  el.style.width = el.style.height = selected ? '38px' : '28px'
}

export default function MapView({
  entries,
  selectedId,
  onSelect,
}: {
  entries: LibraryEntry[]
  selectedId: string | null
  onSelect: (placeId: string | null) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>>(new Map())
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    if (!box.current) return
    const m = new maplibregl.Map({ container: box.current, style: STYLE, center: [-73.99, 40.73], zoom: 11, attributionControl: { compact: true } })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    m.on('click', () => onSelectRef.current(null))
    map.current = m
    const current = markers.current
    return () => {
      current.clear()
      m.remove()
      map.current = null
    }
  }, [])

  // Sync markers with the filtered entries.
  useEffect(() => {
    const m = map.current
    if (!m) return
    const present = markers.current
    const keep = new Set(entries.map((e) => e.place.id))
    for (const [id, { marker }] of present) {
      if (!keep.has(id)) {
        marker.remove()
        present.delete(id)
      }
    }
    for (const entry of entries) {
      const verdict = representativeVisit(entry.visits)?.verdict ?? 'fine'
      const existing = present.get(entry.place.id)
      if (existing) {
        existing.el.style.background = COLOR[verdict]
        continue
      }
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', `${entry.place.name}, ${VERDICT_LABEL[verdict]}`)
      el.style.cssText = `width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer;background:${COLOR[verdict]}`
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        onSelectRef.current(entry.place.id)
      })
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([entry.place.lng, entry.place.lat]).addTo(m)
      present.set(entry.place.id, { marker, el })
    }
    const b = boundsOf(entries)
    if (b) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: { top: 60, bottom: 200, left: 40, right: 40 }, maxZoom: 15, duration: 0 })
  }, [entries])

  // Highlight the selected pin and centre on it.
  useEffect(() => {
    for (const [id, { el }] of markers.current) styleSelected(el, id === selectedId)
    const sel = selectedId ? entries.find((e) => e.place.id === selectedId) : null
    if (sel) map.current?.easeTo({ center: [sel.place.lng, sel.place.lat], duration: 300 })
  }, [selectedId, entries])

  return <div ref={box} className="h-full w-full" role="application" aria-label="Map of places you've logged" />
}
