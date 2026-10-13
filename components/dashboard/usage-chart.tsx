'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { PeriodType } from '@/lib/api'
import { formatBaht, formatPeriod } from '@/lib/format'
import { useUsage } from '@/lib/hooks'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const RANGES: { value: PeriodType; label: string; caption: string }[] = [
  { value: 'HOUR', label: 'Hours', caption: 'Last 24 hours' },
  { value: 'DAY', label: 'Days', caption: 'Last 30 days' },
  { value: 'MONTH', label: 'Months', caption: 'Last 12 months' },
  { value: 'YEAR', label: 'Years', caption: 'Last 5 years' },
]

const chartConfig = { totalKwh: { label: 'Energy', color: 'var(--chart-1)' } } satisfies ChartConfig

export function UsageChart({ meterId, rate }: { meterId: number | null; rate: number }) {
  const [type, setType] = useState<PeriodType>('HOUR')
  const { data, isLoading } = useUsage(meterId, type)
  const range = RANGES.find((r) => r.value === type)!
  const total = data?.reduce((sum, p) => sum + p.totalKwh, 0) ?? 0

  return (
    <section aria-labelledby="usage-chart-title" className="rounded-xl border bg-card">
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 id="usage-chart-title" className="text-sm font-semibold">
            Consumption history
          </h2>
          <p className="text-sm text-muted-foreground">
            {range.caption} ·{' '}
            <span className="font-mono text-foreground tabular-nums">
              {total.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh
            </span>{' '}
            ≈ <span className="font-mono text-foreground tabular-nums">{formatBaht(total * rate)}</span>
          </p>
        </div>
        <Tabs value={type} onValueChange={(v) => setType(v as PeriodType)}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <div className="px-2 pt-4 pb-2 sm:px-4">
        {isLoading && !data ? (
          <Skeleton className="h-72 w-full" />
        ) : !data?.length ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No usage recorded in this range yet. Try generating history in the simulator.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="periodStart"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(v: string) => formatPeriod(v, type)}
              />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${v}`} />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={({ active, payload }) => {
                  const point = active ? payload?.[0]?.payload : null
                  if (!point) return null
                  return (
                    <div className="flex min-w-44 flex-col gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                      <span className="font-medium">{formatPeriod(point.periodStart, type, true)}</span>
                      <Row label="Energy" value={`${point.totalKwh.toFixed(3)} kWh`} />
                      <Row label="Cost" value={formatBaht(point.totalKwh * rate)} />
                      <Row label="Peak" value={`${Math.round(point.peakWatts).toLocaleString('en-US')} W`} />
                    </div>
                  )
                }}
              />
              <Bar dataKey="totalKwh" fill="var(--color-totalKwh)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </span>
  )
}
