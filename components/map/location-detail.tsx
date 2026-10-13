'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteLocation } from '@/app/actions/locations'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { typeLabel } from '@/lib/location-types'
import { DevicesManager } from './devices-manager'
import type { MapLocation } from './types'

interface LocationDetailProps {
  location: MapLocation
  isAdmin: boolean
  isSignedIn: boolean
  onBack: () => void
}

export function LocationDetail({ location, isAdmin, isSignedIn, onBack }: LocationDetailProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLocation(location.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Removed ${location.name}`)
      onBack()
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          All buildings
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {typeLabel(location.type)}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-balance">{location.name}</h2>
          {location.address && (
            <p className="text-sm leading-relaxed text-muted-foreground">{location.address}</p>
          )}
        </div>

        <p className="flex items-center gap-2 rounded-md bg-accent/40 px-3 py-2 text-sm font-medium">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Wattline meter installed
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border text-sm">
          <div className="flex flex-col gap-0.5 bg-card p-3">
            <dt className="text-xs text-muted-foreground">Meters</dt>
            <dd className="font-mono text-base">{location.deviceCount}</dd>
          </div>
          <div className="flex flex-col gap-0.5 bg-card p-3">
            <dt className="text-xs text-muted-foreground">Added</dt>
            <dd className="font-mono text-base">
              {new Date(location.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </dd>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5 bg-card p-3">
            <dt className="text-xs text-muted-foreground">Coordinates</dt>
            <dd className="font-mono text-sm">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </dd>
          </div>
        </dl>

        {location.notes && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-medium text-muted-foreground">Notes</h3>
            <p className="text-sm leading-relaxed text-pretty">{location.notes}</p>
          </div>
        )}

        {isAdmin ? (
          <DevicesManager locationId={location.id} />
        ) : (
          <div className="flex flex-col gap-3 rounded-md border p-4">
            <h3 className="text-sm font-semibold">Live here?</h3>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              Ask the dorm owner for your room&apos;s device ID and password, then link it to your account to see
              your own usage and bill.
            </p>
            <Button render={<Link href={isSignedIn ? '/' : '/sign-up'} />} nativeButton={false}>
              {isSignedIn ? 'Activate my meter' : 'Create an account'}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="border-t p-4">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="lg" className="w-full" disabled={pending} />}>
              <Trash2 data-icon="inline-start" />
              Remove location
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {location.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  The pin and its room devices will be removed, and residents will lose access to those meters.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
