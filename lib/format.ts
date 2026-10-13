import type { PeriodType } from './api'

// Backend sends zone-less LocalDateTime strings (Asia/Bangkok wall clock); parse them as wall-clock values.
export function parseLocal(value: string) {
  const [date, time = '00:00:00'] = value.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm, ss] = time.split(':').map((part) => Number.parseFloat(part))
  return new Date(y, m - 1, d, hh || 0, mm || 0, Math.floor(ss || 0))
}

const baht = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatBaht = (value: number) => baht.format(value)

export function formatKwh(value: number, digits = 2) {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })} kWh`
}

export function formatWatts(value: number) {
  if (value >= 1000) {
    return { value: (value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }), unit: 'kW' }
  }
  return { value: Math.round(value).toLocaleString('en-US'), unit: 'W' }
}

export function formatTime(value: string) {
  return parseLocal(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDateTime(value: string) {
  return parseLocal(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPeriod(value: string, type: PeriodType, long = false) {
  const date = parseLocal(value)
  switch (type) {
    case 'HOUR':
      return long
        ? date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    case 'DAY':
      return date.toLocaleDateString('en-GB', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })
    case 'MONTH':
      return date.toLocaleDateString('en-GB', long ? { month: 'long', year: 'numeric' } : { month: 'short' })
    default:
      return String(date.getFullYear())
  }
}
