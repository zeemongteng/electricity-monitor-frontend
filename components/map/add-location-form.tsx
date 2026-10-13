'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createLocation } from '@/app/actions/locations'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LOCATION_TYPES, LOCATION_TYPE_LABEL, type LocationType } from '@/lib/location-types'
import type { LatLng } from './types'

interface AddLocationFormProps {
  draft: LatLng | null
  onDraftChange: (point: LatLng | null) => void
  onDone: () => void
}

const typeItems = LOCATION_TYPES.map((t) => ({ value: t, label: LOCATION_TYPE_LABEL[t] }))

export function AddLocationForm({ draft, onDraftChange, onDone }: AddLocationFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState<LocationType>('dorm')
  const [error, setError] = useState<string | null>(null)

  function updateCoord(key: 'lat' | 'lng', raw: string) {
    const value = Number(raw)
    if (raw === '' || !Number.isFinite(value)) return
    onDraftChange({ lat: draft?.lat ?? 0, lng: draft?.lng ?? 0, [key]: value })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!draft) {
      setError('Click the map to place the pin first.')
      return
    }
    const form = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createLocation({
        name: String(form.get('name') ?? ''),
        address: String(form.get('address') ?? ''),
        notes: String(form.get('notes') ?? ''),
        deviceCount: Number(form.get('deviceCount') ?? 1),
        type,
        lat: draft.lat,
        lng: draft.lng,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Location added to the map')
      onDone()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b p-4">
        <h2 className="text-lg font-semibold tracking-tight">Add a location</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Place a pin on the map, then describe the building.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="loc-name">Building name</FieldLabel>
            <Input id="loc-name" name="name" required minLength={2} maxLength={120} placeholder="e.g. Chula Dorm Building 3" />
          </Field>

          <Field>
            <FieldLabel htmlFor="loc-type">Type</FieldLabel>
            <Select items={typeItems} value={type} onValueChange={(v) => v && setType(v as LocationType)}>
              <SelectTrigger id="loc-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="loc-address">Address</FieldLabel>
            <Input id="loc-address" name="address" maxLength={240} placeholder="Street, district, city" />
          </Field>

          <Field>
            <FieldLabel htmlFor="loc-devices">Meters installed</FieldLabel>
            <Input id="loc-devices" name="deviceCount" type="number" min={1} max={10000} step={1} defaultValue={1} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="loc-lat">Latitude</FieldLabel>
              <Input
                id="loc-lat"
                key={`lat-${draft?.lat}`}
                type="number"
                step="any"
                defaultValue={draft ? draft.lat.toFixed(6) : ''}
                onBlur={(e) => updateCoord('lat', e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="loc-lng">Longitude</FieldLabel>
              <Input
                id="loc-lng"
                key={`lng-${draft?.lng}`}
                type="number"
                step="any"
                defaultValue={draft ? draft.lng.toFixed(6) : ''}
                onBlur={(e) => updateCoord('lng', e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
          <FieldDescription>Set automatically when you click the map. You can fine-tune them here.</FieldDescription>

          <Field>
            <FieldLabel htmlFor="loc-notes">Notes</FieldLabel>
            <textarea
              id="loc-notes"
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Which floors or rooms are covered"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>
        </FieldGroup>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t p-4">
        <Button type="button" variant="outline" size="lg" onClick={onDone} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={pending} className="flex-1">
          {pending ? 'Saving…' : 'Save location'}
        </Button>
      </div>
    </form>
  )
}
