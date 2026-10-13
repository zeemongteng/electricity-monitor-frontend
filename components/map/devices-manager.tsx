'use client'

import { useState, useTransition } from 'react'
import useSWR from 'swr'
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createDevice,
  deleteDevice,
  listLocationDevices,
  resetDevicePassword,
  type DeviceCredentials,
} from '@/app/actions/devices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DevicesManager({ locationId }: { locationId: number }) {
  const { data: devices, mutate, isLoading } = useSWR(['devices', locationId], () => listLocationDevices(locationId))
  const [room, setRoom] = useState('')
  const [issued, setIssued] = useState<DeviceCredentials | null>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createDevice(locationId, room)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setRoom('')
      setIssued(result)
      await mutate()
    })
  }

  async function handleReset(id: number) {
    setBusyId(id)
    const result = await resetDevicePassword(id)
    setBusyId(null)
    if (!result.ok) return toast.error(result.error)
    setIssued(result)
    await mutate()
  }

  async function handleDelete(id: number) {
    setBusyId(id)
    const result = await deleteDevice(id)
    setBusyId(null)
    if (!result.ok) return toast.error(result.error)
    await mutate()
  }

  return (
    <section aria-labelledby="devices-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 id="devices-title" className="text-sm font-semibold">
          Room devices
        </h3>
        <span className="font-mono text-xs text-muted-foreground">{devices?.length ?? 0} issued</span>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Label htmlFor="new-room" className="sr-only">
          Room number
        </Label>
        <Input
          id="new-room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room, e.g. 4B-12"
          maxLength={40}
          required
        />
        <Button type="submit" disabled={pending || !room.trim()}>
          {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-md bg-secondary" aria-label="Loading devices" />
      ) : devices && devices.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-md border">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">Room {d.room}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {d.code} · {d.claimed ? 'Active' : 'Not activated'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busyId === d.id}
                onClick={() => handleReset(d.id)}
                aria-label={`Issue new password for room ${d.room}`}
                title="New password (unlinks current resident)"
              >
                <KeyRound />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busyId === d.id}
                onClick={() => handleDelete(d.id)}
                aria-label={`Remove device for room ${d.room}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add a room to create its meter and get a device ID and password to give the resident.
        </p>
      )}

      <CredentialsDialog credentials={issued} onClose={() => setIssued(null)} />
    </section>
  )
}

function CredentialsDialog({ credentials, onClose }: { credentials: DeviceCredentials | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!credentials) return
    await navigator.clipboard.writeText(`Device ID: ${credentials.code}\nPassword: ${credentials.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={credentials !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Room {credentials?.room} credentials</DialogTitle>
          <DialogDescription>
            Give these to the resident. The password is shown only once — issue a new one if it&apos;s lost.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-px overflow-hidden rounded-md border bg-border">
          <div className="flex items-center justify-between bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">Device ID</dt>
            <dd className="font-mono text-lg tracking-wider">{credentials?.code}</dd>
          </div>
          <div className="flex items-center justify-between bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">Password</dt>
            <dd className="font-mono text-lg tracking-wider">{credentials?.password}</dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
            {copied ? 'Copied' : 'Copy both'}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
