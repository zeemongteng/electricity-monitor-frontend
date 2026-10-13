'use server'

import { desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { devices, user } from '@/lib/db/schema'

export type Role = 'admin' | 'user'

export interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  meters: number
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

async function requireAdmin() {
  const current = await getSessionUser()
  if (current.role !== 'admin') throw new Error('Forbidden')
  return current
}

export async function markOnboarded() {
  const current = await getSessionUser()
  await db.update(user).set({ onboardedAt: new Date() }).where(eq(user.id, current.id))
}

export async function listUsers(): Promise<UserRow[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      meters: sql<number>`count(${devices.id})::int`,
    })
    .from(user)
    .leftJoin(devices, eq(devices.claimedBy, user.id))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt))

  return rows.map((r) => ({
    ...r,
    role: r.role === 'admin' ? 'admin' : 'user',
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function setUserRole(userId: string, role: Role): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await requireAdmin()

  if (typeof userId !== 'string' || !userId) return { ok: false, error: 'Invalid user.' }
  if (role !== 'admin' && role !== 'user') return { ok: false, error: 'Invalid role.' }
  if (userId === current.id) return { ok: false, error: 'You can’t change your own role.' }

  const updated = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ id: user.id })

  if (updated.length === 0) return { ok: false, error: 'User not found.' }

  revalidatePath('/admin/users')
  return { ok: true }
}
