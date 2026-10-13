import { mutate } from 'swr'

export type PeriodType = 'HOUR' | 'DAY' | 'MONTH' | 'YEAR'
export type ReadingSource = 'AUTO' | 'MANUAL' | 'HISTORY' | 'DEVICE'
export type NotificationKind = 'SPIKE' | 'HOURLY_HIGH' | 'BUDGET'

export interface Meter {
  id: number
  name: string
  location: string | null
  initialReading: number
  currentReading: number
  alertMultiplier: number
  alertsEnabled: boolean
  dailyBudgetKwh: number
  ratePerKwh: number
  createdAt: string
}

export interface Overview {
  meterId: number
  name: string
  initialReading: number
  currentReading: number
  latestPowerWatts: number
  latestAt: string | null
  hourKwh: number
  todayKwh: number
  monthKwh: number
  yearKwh: number
  ratePerKwh: number
  todayCost: number
  monthCost: number
  projectedMonthKwh: number
  projectedMonthCost: number
}

export interface UsagePoint {
  periodStart: string
  totalKwh: number
  peakWatts: number
  recordCount: number
}

export interface Reading {
  id: number
  meterId: number
  recordedAt: string
  powerWatts: number
  durationSeconds: number
  usedKwh: number
  cumulativeKwh: number
  source: ReadingSource
}

export interface AppNotification {
  id: number
  meterId: number
  kind: NotificationKind
  message: string
  createdAt: string
  read: boolean
}

export interface SimulatorStatus {
  autoEnabled: boolean
  intervalMs: number
}

export interface MeterSettings {
  name: string
  alertMultiplier: number
  alertsEnabled: boolean
  dailyBudgetKwh: number
  ratePerKwh: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = undefined
  }
  if (!res.ok) {
    const body = (data ?? {}) as { message?: string; code?: string }
    throw new ApiError(body.message || res.statusText || 'Request failed', res.status, body.code)
  }
  return data as T
}

export const fetcher = <T>(path: string) => api<T>(path)

export function refreshAll() {
  return mutate((key) => typeof key === 'string' && key.startsWith('/api/'))
}

export const actions = {
  setAuto: (enabled: boolean) =>
    api<SimulatorStatus>(`/api/simulator/auto?enabled=${enabled}`, { method: 'POST' }),
  addReading: (meterId: number, powerWatts: number, durationSeconds: number) =>
    api<Reading>('/api/simulator/manual', {
      method: 'POST',
      body: JSON.stringify({ meterId, powerWatts, durationSeconds }),
    }),
  generateHistory: (meterId: number, days: number) =>
    api<{ generated: number }>('/api/simulator/history', {
      method: 'POST',
      body: JSON.stringify({ meterId, days }),
    }),
  generateSample: (meterId: number) =>
    api<{ generated: number }>(`/api/simulator/sample?meterId=${meterId}`, { method: 'POST' }),
  resetAll: () => api<void>('/api/simulator/data', { method: 'DELETE' }),
  updateMeter: (id: number, settings: MeterSettings) =>
    api<Meter>(`/api/meters/${id}`, { method: 'PUT', body: JSON.stringify(settings) }),
  markRead: (id: number) => api<AppNotification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api<void>('/api/notifications/read-all', { method: 'POST' }),
}
