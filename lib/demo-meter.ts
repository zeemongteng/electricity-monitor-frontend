import 'server-only'
import { and, eq } from 'drizzle-orm'
import { backendFetch } from '@/lib/access'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import { DEMO_LOCATION_TYPE } from '@/lib/location-types'
import { generateDeviceCode, generateDevicePassword, hashDevicePassword } from '@/lib/device-secrets'

const SYSTEM_USER = 'system'

async function getDemoLocationId() {
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.type, DEMO_LOCATION_TYPE))
    .limit(1)
  if (existing) return existing.id

  const [created] = await db
    .insert(locations)
    .values({
      name: 'Demo',
      type: DEMO_LOCATION_TYPE,
      lat: 0,
      lng: 0,
      deviceCount: 0,
      notes: 'Holds the demo meters given to new accounts. Hidden from the map.',
      createdBy: SYSTEM_USER,
    })
    .returning({ id: locations.id })
  return created.id
}

/** Gives a user one pre-activated demo meter. Safe to call more than once. */
export async function provisionDemoMeter(userId: string, userName: string) {
  const locationId = await getDemoLocationId()

  const [already] = await db
    .select({ id: devices.id })
    .from(devices)
    .where(and(eq(devices.claimedBy, userId), eq(devices.locationId, locationId)))
    .limit(1)
  if (already) return

  const res = await backendFetch('/api/meters', {
    method: 'POST',
    body: JSON.stringify({ name: `Demo meter for ${userName.trim() || 'new user'}`, location: 'Demo' }),
  })
  if (!res.ok) throw new Error(`Backend responded ${res.status}`)
  const { id: meterId } = (await res.json()) as { id: number }

  // The demo device is claimed up front, so its password is never shown to anyone.
  const passwordHash = await hashDevicePassword(generateDevicePassword())
  for (let attempt = 0; attempt < 5; attempt++) {
    const inserted = await db
      .insert(devices)
      .values({
        code: generateDeviceCode(),
        passwordHash,
        meterId,
        locationId,
        room: 'Demo meter',
        claimedBy: userId,
        claimedAt: new Date(),
        createdBy: SYSTEM_USER,
      })
      .onConflictDoNothing({ target: devices.code })
      .returning({ id: devices.id })
    if (inserted.length > 0) break
    if (attempt === 4) throw new Error('Could not generate a unique device ID for the demo meter')
  }

  // Seed a few readings so the dashboard isn't empty; the meter still works without them.
  await backendFetch(`/api/simulator/sample?meterId=${meterId}`, { method: 'POST' }).catch((error) => {
    console.error('[demo-meter] Failed to seed sample readings', error)
  })
}
