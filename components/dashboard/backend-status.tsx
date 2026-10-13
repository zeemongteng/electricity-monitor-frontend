'use client'

import { Loader2, PlugZap, ServerOff } from 'lucide-react'
import { ApiError } from '@/lib/api'

export function BackendStatus({ error, empty }: { error?: unknown; empty?: boolean }) {
  const notConfigured = error instanceof ApiError && error.code === 'NOT_CONFIGURED'
  const waking = error instanceof ApiError && (error.status === 502 || error.status === 504)

  let icon = <ServerOff className="size-6" aria-hidden />
  let title = 'Could not load your meters'
  let body = error instanceof Error ? error.message : 'Something went wrong talking to the backend.'

  if (empty) {
    icon = <PlugZap className="size-6" aria-hidden />
    title = 'No meters yet'
    body = 'Add a building on the coverage map, then add a device for each room to create its meter.'
  } else if (notConfigured) {
    icon = <PlugZap className="size-6" aria-hidden />
    title = 'Connect your backend'
    body =
      'Add a BACKEND_URL environment variable pointing at your Spring Boot service (for example https://electricity-monitor.onrender.com). Requests to /api/* are forwarded there.'
  } else if (waking) {
    icon = <Loader2 className="size-6 animate-spin" aria-hidden />
    title = 'Waking up the backend'
    body = 'Free Render instances sleep after 15 minutes. This usually takes under a minute — retrying automatically.'
  }

  return (
    <section
      aria-live="polite"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border bg-card px-6 py-14 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <h1 className="text-xl font-semibold text-balance">{title}</h1>
      <p className="leading-relaxed text-pretty text-muted-foreground">{body}</p>
    </section>
  )
}
