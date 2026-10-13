'use client'

import { formatBaht } from '@/lib/format'
import { useOverview } from '@/lib/hooks'
import { Skeleton } from '@/components/ui/skeleton'

function kwh(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function UsageStats({ meterId }: { meterId: number | null }) {
  const { data: o } = useOverview(meterId)

  const periods = o
    ? [
        { label: 'This hour', value: o.hourKwh },
        { label: 'Today', value: o.todayKwh },
        { label: 'This month', value: o.monthKwh },
        { label: 'This year', value: o.yearKwh },
      ]
    : []

  return (
    <article className="flex h-full flex-col rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Usage & cost</h2>
        {o && (
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {formatBaht(o.ratePerKwh)}/kWh
          </span>
        )}
      </header>

      <dl className="grid grid-cols-2 border-b">
        {o
          ? periods.map((p, i) => (
              <div
                key={p.label}
                className={`flex flex-col gap-1 px-5 py-4 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''}`}
              >
                <dt className="text-xs text-muted-foreground">{p.label}</dt>
                <dd className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-semibold tabular-nums">{kwh(p.value)}</span>
                  <span className="text-xs text-muted-foreground">kWh</span>
                </dd>
              </div>
            ))
          : Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
      </dl>

      <div className="flex flex-1 flex-col justify-between gap-4 px-5 py-4">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Cost today</dt>
            <dd className="font-mono tabular-nums">{o ? formatBaht(o.todayCost) : '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Cost this month so far</dt>
            <dd className="font-mono tabular-nums">{o ? formatBaht(o.monthCost) : '—'}</dd>
          </div>
        </dl>

        <div className="flex items-end justify-between gap-3 rounded-lg bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex flex-col">
            <span className="text-xs text-primary-foreground/75">Projected bill this month</span>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {o ? formatBaht(o.projectedMonthCost) : '—'}
            </span>
          </div>
          <span className="pb-1 font-mono text-xs text-primary-foreground/75">
            {o ? `${kwh(o.projectedMonthKwh)} kWh` : ''}
          </span>
        </div>
      </div>
    </article>
  )
}
