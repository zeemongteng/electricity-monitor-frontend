'use server'

import { and, asc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { backendFetch } from '@/lib/access'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import {
  generateDeviceCode,
  generateDevicePassword,
  hashDevicePassword,
  normalizeDeviceCode,
  verifyDevicePassword,
} from '@/lib/device-secrets'

type Fail = { ok: false; error: string }
export type DeviceCredentials = { code: string; password: string; room: string }

export interface AdminDevice {
  id: number
  code: string
  room: string
  meterId: number
  claimed: boolean
  claimedAt: string | null
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') throw new Error('Forbidden')
  return user.id
}

export async function activateDevice(
  codeInput: string,
  password: string,
): Promise<{ ok: true; meterId: number; room: string; building: string } | Fail> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Sign in to activate a meter.' }

  const code = normalizeDeviceCode(codeInput)
  if (!/^WL-[A-Z0-9]{6}$/.test(code) || password.trim().length < 4) {
    return { ok: false, error: 'Check the device ID and password and try again.' }
  }

  const [device] = await db
    .select({
      id: devices.id,
      passwordHash: devices.passwordHash,
      meterId: devices.meterId,
      room: devices.room,
      claimedBy: devices.claimedBy,
      building: locations.name,
    })
    .from(devices)
    .innerJoin(locations, eq(locations.id, devices.locationId))
    .where(eq(devices.code, code))
    .limit(1)

  // Same message for unknown ID and wrong password so IDs can't be enumerated.
  if (!device || !(await verifyDevicePassword(password, device.passwordHash))) {
    return { ok: false, error: 'That device ID and password don’t match.' }
  }

  if (device.claimedBy && device.claimedBy !== user.id) {
    return {
      ok: false,
      error: 'This meter is already active for another resident. Ask your dorm owner to reset its password.',
    }
  }

  if (!device.claimedBy) {
    const updated = await db
      .update(devices)
      .set({ claimedBy: user.id, claimedAt: new Date() })
      .where(and(eq(devices.id, device.id), isNull(devices.claimedBy)))
      .returning({ id: devices.id })
    if (updated.length === 0) {
      return { ok: false, error: 'This meter was just activated by someone else.' }
    }
  }

  revalidatePath('/')
  return { ok: true, meterId: device.meterId, room: device.room, building: device.building }
}

export async function listLocationDevices(locationId: number): Promise<AdminDevice[]> {
  await requireAdmin()
  const rows = await db
    .select()
    .from(devices)
    .where(eq(devices.locationId, locationId))
    .orderBy(asc(devices.room))
  return rows.map((d) => ({
    id: d.id,
    code: d.code,
    room: d.room,
    meterId: d.meterId,
    claimed: d.claimedBy !== null,
    claimedAt: d.claimedAt?.toISOString() ?? null,
  }))
}

export async function createDevice(
  locationId: number,
  roomInput: string,
): Promise<({ ok: true } & DeviceCredentials) | Fail> {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch {
    return { ok: false, error: 'Only admins can add devices.' }
  }

  const room = roomInput.trim()
  if (room.length < 1 || room.length > 40) return { ok: false, error: 'Room must be 1–40 characters.' }

  const [location] = await db.select().from(locations).where(eq(locations.id, locationId)).limit(1)
  if (!location) return { ok: false, error: 'Building not found.' }

  let meterId: number
  try {
    const res = await backendFetch('/api/meters', {
      method: 'POST',
      body: JSON.stringify({ name: `${location.name} · ${room}`, location: location.address ?? location.name }),
    })
    if (!res.ok) throw new Error(`Backend responded ${res.status}`)
    meterId = ((await res.json()) as { id: number }).id
  } catch (error) {
    console.error('[devices] Failed to create backend meter', error)
    return { ok: false, error: 'The meter backend didn’t respond. It may be waking up — try again in a minute.' }
  }

  const password = generateDevicePassword()
  const passwordHash = await hashDevicePassword(password)

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateDeviceCode()
    const inserted = await db
      .insert(devices)
      .values({ code, passwordHash, meterId, locationId, room, createdBy: adminId })
      .onConflictDoNothing({ target: devices.code })
      .returning({ id: devices.id })
    if (inserted.length > 0) return { ok: true, code, password, room }
  }
  return { ok: false, error: 'Could not generate a unique device ID. Try again.' }
}

export async function resetDevicePassword(id: number): Promise<({ ok: true } & DeviceCredentials) | Fail> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Only admins can reset devices.' }
  }

  const password = generateDevicePassword()
  const [device] = await db
    .update(devices)
    .set({ passwordHash: await hashDevicePassword(password), claimedBy: null, claimedAt: null })
    .where(eq(devices.id, id))
    .returning({ code: devices.code, room: devices.room })
  if (!device) return { ok: false, error: 'Device not found.' }
  return { ok: true, code: device.code, password, room: device.room }
}

export async function deleteDevice(id: number): Promise<{ ok: true } | Fail> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Only admins can remove devices.' }
  }
  await db.delete(devices).where(eq(devices.id, id))
  return { ok: true }
}
