'use client'

import { History, Loader2, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { actions, refreshAll } from '@/lib/api'
import { useSimulator } from '@/lib/hooks'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Busy = null | 'auto' | 'manual' | 'history' | 'sample' | 'reset'

export function SimulatorPanel({ meterId, isAdmin }: { meterId: number | null; isAdmin: boolean }) {
  const { data: sim, mutate: mutateSim } = useSimulator(isAdmin)
  const [busy, setBusy] = useState<Busy>(null)
  const [watts, setWatts] = useState('1500')
  const [seconds, setSeconds] = useState('3600')
  const [days, setDays] = useState('30')

  async function run(kind: Exclude<Busy, null>, task: () => Promise<unknown>, success: string) {
    setBusy(kind)
    try {
      await task()
      await refreshAll()
      toast.success(success)
    } catch (error) {
      toast.error('Request failed', { description: (error as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const disabled = !meterId || busy !== null

  return (
    <section aria-labelledby="sim-title" className="flex h-full flex-col rounded-xl border bg-card">
      <header className="flex flex-col gap-0.5 border-b px-5 py-4">
        <h2 id="sim-title" className="text-sm font-semibold">
          Simulator
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Feed test readings into the meter.</p>
      </header>

      {isAdmin && (
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="auto-sim">Auto readings</Label>
          <span className="text-xs text-muted-foreground">
            {sim ? `New reading every ${Math.round(sim.intervalMs / 1000)}s` : 'Loading…'}
          </span>
        </div>
        <Switch
          id="auto-sim"
          checked={sim?.autoEnabled ?? false}
          disabled={!sim || busy === 'auto'}
          onCheckedChange={(enabled) =>
            run(
              'auto',
              async () => mutateSim(await actions.setAuto(enabled), { revalidate: false }),
              enabled ? 'Auto readings started' : 'Auto readings paused',
            )
          }
        />
      </div>
      )}

      <form
        className="flex flex-col gap-3 border-b px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!meterId) return
          run('manual', () => actions.addReading(meterId, Number(watts), Number(seconds)), 'Reading added')
        }}
      >
        <span className="text-sm font-medium">Manual reading</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-watts" className="text-xs text-muted-foreground">
              Power (W)
            </Label>
            <Input id="sim-watts" type="number" min={0} required value={watts} onChange={(e) => setWatts(e.target.value)} className="font-mono" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-seconds" className="text-xs text-muted-foreground">
              Duration (s)
            </Label>
            <Input
              id="sim-seconds"
              type="number"
              min={1}
              required
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={disabled} className="self-start">
          {busy === 'manual' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          Add reading
        </Button>
      </form>

      <div className="flex flex-col gap-3 px-5 py-4">
        <span className="text-sm font-medium">Bulk data</span>
        <div className="flex items-end gap-2">
          <div className="flex w-24 flex-col gap-1.5">
            <Label htmlFor="sim-days" className="text-xs text-muted-foreground">
              Days
            </Label>
            <Input
              id="sim-days"
              type="number"
              min={1}
              max={180}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              meterId &&
              run(
                'history',
                () => actions.generateHistory(meterId, Math.min(180, Math.max(1, Number(days) || 1))),
                'History generated',
              )
            }
          >
            {busy === 'history' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <History data-icon="inline-start" />}
            Generate history
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => meterId && run('sample', () => actions.generateSample(meterId), 'Sample data added')}
          >
            {busy === 'sample' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
            Sample day
          </Button>

          {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={busy !== null} />}>
              <RotateCcw data-icon="inline-start" />
              Reset all data
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all meter data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes every reading, usage rollup, and alert, and returns meters to their initial reading.
                  It can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => run('reset', actions.resetAll, 'All data reset')}>
                  Reset data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </div>
    </section>
  )
}
