import 'server-only'
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

// No 0/O, 1/I/L so codes can be read aloud or copied from paper without mistakes.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomString(length: number) {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

export function generateDeviceCode() {
  return `WL-${randomString(6)}`
}

export function generateDevicePassword() {
  return `${randomString(4)}-${randomString(4)}`
}

export function normalizeDeviceCode(input: string) {
  const raw = input.trim().toUpperCase().replace(/\s+/g, '')
  return raw.startsWith('WL-') ? raw : `WL-${raw.replace(/^WL/, '')}`
}

export function normalizeDevicePassword(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

export async function hashDevicePassword(password: string) {
  const salt = randomBytes(16)
  const key = await scryptAsync(normalizeDevicePassword(password), salt, 32)
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyDevicePassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(':')
  if (!saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scryptAsync(normalizeDevicePassword(password), Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}
