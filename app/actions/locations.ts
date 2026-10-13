'use server'

import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import { LOCATION_TYPES, type LocationType } from '@/lib/location-types'

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Forbidden')
  return session.user.id
}

export async function getLocations() {
  return db.select().from(locations).orderBy(asc(locations.name))
}

export interface LocationInput {
  name: string
  address: string
  type: string
  lat: number
  lng: number
  deviceCount: number
  notes: string
}

function validate(input: LocationInput): string | null {
  const name = input.name.trim()
  if (name.length < 2 || name.length > 120) return 'Name must be 2–120 characters.'
  if (input.address.length > 240) return 'Address is too long.'
  if (input.notes.length > 500) return 'Notes are too long.'
  if (!LOCATION_TYPES.includes(input.type as LocationType)) return 'Invalid building type.'
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) return 'Invalid latitude.'
  if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) return 'Invalid longitude.'
  if (!Number.isInteger(input.deviceCount) || input.deviceCount < 1 || input.deviceCount > 10000)
    return 'Device count must be a whole number between 1 and 10,000.'
  return null
}

export async function createLocation(input: LocationInput): Promise<ActionResult> {
  let userId: string
  try {
    userId = await requireAdmin()
  } catch {
    return { ok: false, error: 'Only admins can add locations.' }
  }

  const error = validate(input)
  if (error) return { ok: false, error }

  await db.insert(locations).values({
    name: input.name.trim(),
    address: input.address.trim() || null,
    type: input.type,
    lat: input.lat,
    lng: input.lng,
    deviceCount: input.deviceCount,
    notes: input.notes.trim() || null,
    createdBy: userId,
  })
  revalidatePath('/map')
  return { ok: true }
}

export async function deleteLocation(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Only admins can remove locations.' }
  }
  if (!Number.isInteger(id)) return { ok: false, error: 'Invalid location.' }

  await db.delete(devices).where(eq(devices.locationId, id))
  await db.delete(locations).where(eq(locations.id, id))
  revalidatePath('/map')
  return { ok: true }
}
