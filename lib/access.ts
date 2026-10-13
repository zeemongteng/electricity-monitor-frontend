import 'server-only'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'

export interface Access {
  userId: string
  isAdmin: boolean
  meterIds: Set<number>
  canUse: (meterId: unknown) => boolean
}

export async function getAccess(headers: Headers): Promise<Access | null> {
  const session = await auth.api.getSession({ headers })
  if (!session?.user) return null

  const isAdmin = session.user.role === 'admin'
  const rows = await db
    .select({ meterId: devices.meterId })
    .from(devices)
    .where(eq(devices.claimedBy, session.user.id))
  const meterIds = new Set(rows.map((r) => r.meterId))

  return {
    userId: session.user.id,
    isAdmin,
    meterIds,
    canUse: (meterId) => {
      const id = Number(meterId)
      return Number.isInteger(id) && id > 0 && (isAdmin || meterIds.has(id))
    },
  }
}

export async function backendFetch(path: string, init?: RequestInit) {
  const base = process.env.BACKEND_URL
  if (!base) throw new Error('BACKEND_URL is not set')
  return fetch(new URL(path, base), {
    ...init,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...init?.headers },
    cache: 'no-store',
    // Render free instances can take ~60s to wake from sleep.
    signal: AbortSignal.timeout(75_000),
  })
}
