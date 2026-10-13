'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { LatLng, MapLocation } from './types'

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]

function pinIcon(variant: 'installed' | 'selected' | 'draft') {
  return L.divIcon({
    className: '',
    html: `<span class="wl-pin wl-pin--${variant}"><span></span></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    tooltipAnchor: [0, -30],
  })
}

interface LeafletMapProps {
  locations: MapLocation[]
  selectedId: number | null
  onSelect: (id: number) => void
  addMode: boolean
  draft: LatLng | null
  onPick: (point: LatLng) => void
}

export default function LeafletMap({ locations, selectedId, onSelect, addMode, draft, onPick }: LeafletMapProps) {
  const icons = useMemo(
    () => ({ installed: pinIcon('installed'), selected: pinIcon('selected'), draft: pinIcon('draft') }),
    [],
  )
  const selected = locations.find((l) => l.id === selectedId) ?? null
  const center: [number, number] = locations[0] ? [locations[0].lat, locations[0].lng] : DEFAULT_CENTER

  return (
    <MapContainer
      center={center}
      zoom={locations.length ? 13 : 11}
      className={`size-full ${addMode ? 'wl-add-mode' : ''}`}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl />
      <ClickHandler enabled={addMode} onPick={onPick} />
      <FlyTo point={draft ?? (selected ? { lat: selected.lat, lng: selected.lng } : null)} />
      {locations.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={l.id === selectedId ? icons.selected : icons.installed}
          eventHandlers={{ click: () => onSelect(l.id) }}
          keyboard
          title={l.name}
          alt={l.name}
        >
          <Tooltip direction="top">{l.name}</Tooltip>
        </Marker>
      ))}
      {draft && <Marker position={[draft.lat, draft.lng]} icon={icons.draft} title="New location" />}
    </MapContainer>
  )
}

function ZoomControl() {
  const map = useMap()
  useEffect(() => {
    const control = L.control.zoom({ position: 'bottomright' }).addTo(map)
    return () => {
      control.remove()
    }
  }, [map])
  return null
}

function ClickHandler({ enabled, onPick }: { enabled: boolean; onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FlyTo({ point }: { point: LatLng | null }) {
  const map = useMap()
  const lat = point?.lat
  const lng = point?.lng
  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [map, lat, lng])
  return null
}
