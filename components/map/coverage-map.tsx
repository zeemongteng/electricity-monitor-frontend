'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { CheckCircle2, MapPin, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { typeLabel } from '@/lib/location-types'
import { cn } from '@/lib/utils'
import { AddLocationForm } from './add-location-form'
import { LocationDetail } from './location-detail'
import type { LatLng, MapLocation } from './types'

const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-secondary" aria-label="Loading map" />,
})

interface CoverageMapProps {
  locations: MapLocation[]
  isAdmin: boolean
  isSignedIn: boolean
}

export function CoverageMap({ locations, isAdmin, isSignedIn }: CoverageMapProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [draft, setDraft] = useState<LatLng | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return locations
    return locations.filter(
      (l) => l.name.toLowerCase().includes(q) || (l.address ?? '').toLowerCase().includes(q),
    )
  }, [locations, query])

  const selected = locations.find((l) => l.id === selectedId) ?? null
  const totalDevices = locations.reduce((sum, l) => sum + l.deviceCount, 0)

  function startAdd() {
    setAddMode(true)
    setSelectedId(null)
    setDraft(null)
  }

  function stopAdd() {
    setAddMode(false)
    setDraft(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
      <aside className="flex max-h-[55dvh] min-h-0 w-full shrink-0 flex-col border-t bg-card md:max-h-none md:w-96 md:border-t-0 md:border-r">
        {addMode ? (
          <AddLocationForm draft={draft} onDraftChange={setDraft} onDone={stopAdd} />
        ) : selected ? (
          <LocationDetail location={selected} isAdmin={isAdmin} isSignedIn={isSignedIn} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b p-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold tracking-tight text-balance">Is your building connected?</h1>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  Search for your dorm or apartment to see if a Wattline meter is installed.
                </p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Building name or address"
                  aria-label="Search buildings"
                  className="pl-8"
                />
              </div>
              <QueryVerdict query={query} matches={results.length} />
            </div>

            <div className="flex items-center justify-between px-4 pt-3 pb-2 text-xs text-muted-foreground">
              <span>
                {locations.length} {locations.length === 1 ? 'building' : 'buildings'}
              </span>
              <span className="font-mono">{totalDevices} meters</span>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {results.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-secondary"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{l.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {typeLabel(l.type)}
                        {l.address ? ` · ${l.address}` : ''}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{l.deviceCount}</span>
                  </button>
                </li>
              ))}
              {locations.length === 0 && (
                <li className="px-2 py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  No buildings have been added yet.
                  {isAdmin ? ' Use “Add location” to mark the first one.' : ''}
                </li>
              )}
            </ul>

            {isAdmin && (
              <div className="border-t p-4">
                <Button onClick={startAdd} size="lg" className="w-full">
                  <Plus data-icon="inline-start" />
                  Add location
                </Button>
              </div>
            )}
          </>
        )}
      </aside>

      <section aria-label="Map" className="relative min-h-0 flex-1">
        <LeafletMap
          locations={locations}
          selectedId={selectedId}
          onSelect={(id) => {
            if (addMode) return
            setSelectedId(id)
          }}
          addMode={addMode}
          draft={draft}
          onPick={setDraft}
        />
        {addMode && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground py-1.5 pr-1.5 pl-4 text-sm text-background shadow-lg">
              {draft ? 'Pin placed — click again to move it' : 'Click the map to place a pin'}
              <Button size="icon-sm" variant="ghost" onClick={stopAdd} aria-label="Cancel adding" className="text-background hover:bg-background/15 hover:text-background">
                <X />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function QueryVerdict({ query, matches }: { query: string; matches: number }) {
  if (!query.trim()) return null
  const found = matches > 0
  return (
    <p
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-md px-3 py-2 text-sm leading-relaxed',
        found ? 'bg-accent/40 text-foreground' : 'bg-secondary text-muted-foreground',
      )}
    >
      {found ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <Search className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      {found
        ? `${matches} matching ${matches === 1 ? 'building has' : 'buildings have'} meters installed.`
        : 'No match found — this building doesn’t have a Wattline meter yet.'}
    </p>
  )
}
