'use client'

import useSWR from 'swr'
import {
  fetcher,
  type AppNotification,
  type Meter,
  type Overview,
  type PeriodType,
  type Reading,
  type SimulatorStatus,
  type UsagePoint,
} from './api'

export function useMeters() {
  return useSWR<Meter[]>('/api/meters', fetcher, { refreshInterval: 30_000 })
}

export function useOverview(meterId: number | null) {
  return useSWR<Overview>(meterId ? `/api/meters/${meterId}/overview` : null, fetcher, {
    refreshInterval: 5_000,
  })
}

export function useUsage(meterId: number | null, type: PeriodType) {
  return useSWR<UsagePoint[]>(meterId ? `/api/usage?meterId=${meterId}&type=${type}` : null, fetcher, {
    refreshInterval: 15_000,
    keepPreviousData: true,
  })
}

export function useReadings(meterId: number | null) {
  return useSWR<Reading[]>(meterId ? `/api/readings?meterId=${meterId}` : null, fetcher, {
    refreshInterval: 5_000,
  })
}

export function useNotifications() {
  return useSWR<AppNotification[]>('/api/notifications', fetcher, { refreshInterval: 5_000 })
}

export function useSimulator(enabled = true) {
  return useSWR<SimulatorStatus>(enabled ? '/api/simulator' : null, fetcher, { refreshInterval: 30_000 })
}
