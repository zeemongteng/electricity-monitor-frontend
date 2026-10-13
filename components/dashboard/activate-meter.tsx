'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { mutate } from 'swr'
import { toast } from 'sonner'
import { activateDevice } from '@/app/actions/devices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ActivateMeterFormProps {
  onActivated?: (meterId: number) => void
  submitLabel?: string
}

export function ActivateMeterForm({ onActivated, submitLabel = 'Activate meter' }: ActivateMeterFormProps) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await activateDevice(code, password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      await mutate('/api/meters')
      toast.success(`${result.building} · ${result.room} is now linked to your account`)
      setCode('')
      setPassword('')
      onActivated?.(result.meterId)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="device-code">Device ID</Label>
        <Input
          id="device-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="WL-XXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className="font-mono tracking-wider uppercase"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="device-password">Device password</Label>
        <Input
          id="device-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          required
          className="font-mono tracking-wider"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending || !code.trim() || !password.trim()}>
        {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <KeyRound data-icon="inline-start" />}
        {submitLabel}
      </Button>
    </form>
  )
}

export function ActivateMeterPanel({ onActivated }: { onActivated?: (meterId: number) => void }) {
  return (
    <section
      aria-labelledby="activate-title"
      className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-xl border bg-card md:grid-cols-2"
    >
      <div className="flex flex-col gap-5 border-b bg-secondary/40 p-6 md:border-r md:border-b-0 md:p-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">Step 2 of 2</span>
          <h1 id="activate-title" className="text-2xl font-semibold tracking-tight text-balance">
            Link the meter in your room
          </h1>
          <p className="leading-relaxed text-pretty text-muted-foreground">
            When you move in, your dorm owner gives you a device ID and password for the Wattline meter in your
            room. Enter them here to start tracking your own electricity use.
          </p>
        </div>
        <ol className="flex flex-col gap-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">1</span>
            <span>Check the coverage map to confirm your building has meters.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">2</span>
            <span>Ask your dorm owner for your room&apos;s device ID and password.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-muted-foreground">3</span>
            <span>Activate it once — it stays linked to your account until you move out.</span>
          </li>
        </ol>
      </div>
      <div className="p-6 md:p-8">
        <ActivateMeterForm onActivated={onActivated} />
      </div>
    </section>
  )
}
