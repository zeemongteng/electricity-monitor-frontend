'use client'

import { useMemo } from 'react'
import { Area, AreaChart, YAxis } from 'recharts'
import { formatTime, formatWatts, parseLocal } from '@/lib/format'
import { useOverview, useReadings } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

const sparkConfig = { powerWatts: { label: 'Power', color: 'var(--accent)' } } satisfies ChartConfig

function Digit({ value, decimal }: { value: number; decimal?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-block h-[1.15em] w-[0.72em] overflow-hidden rounded-[3px] text-center',
        decimal ? 'bg-accent text-accent-foreground' : 'bg-meter-foreground/10',
      )}
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex h-[1.15em] items-center justify-center">
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}

function Odometer({ value }: { value: number }) {
  const [whole, fraction] = Math.max(0, value).toFixed(1).split('.')
  const digits = whole.padStart(6, '0').slice(-6).split('').map(Number)

  return (
    <div
      className="flex items-center gap-1 font-mono text-4xl font-semibold tabular-nums sm:text-5xl"
      role="img"
      aria-label={`Meter reading ${value.toFixed(1)} kilowatt hours`}
    >
      {digits.map((d, i) => (
        <Digit key={i} value={d} />
      ))}
      <span className="px-0.5 text-meter-foreground/50" aria-hidden>
        .
      </span>
      <Digit value={Number(fraction)} decimal />
    </div>
  )
}

export function MeterFace({ meterId, location }: { meterId: number | null; location: string | null }) {
  const { data: overview } = useOverview(meterId)
  const { data: readings } = useReadings(meterId)

  const spark = useMemo(
    () =>
      [...(readings ?? [])]
        .sort((a, b) => parseLocal(a.recordedAt).getTime() - parseLocal(b.recordedAt).getTime())
        .slice(-48),
    [readings],
  )

  const power = formatWatts(overview?.latestPowerWatts ?? 0)
  const isLive = overview?.latestAt && Date.now() - parseLocal(overview.latestAt).getTime() < 60_000

  return (
    <article className="flex h-full flex-col gap-6 rounded-xl bg-meter p-5 text-meter-foreground sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-medium text-meter-foreground/70">{overview?.name ?? 'Meter'}</h1>
          {location && <p className="text-xs text-meter-foreground/50">{location}</p>}
        </div>
        <span className="flex items-center gap-2 rounded-full border border-meter-foreground/15 px-2.5 py-1 text-xs">
          <span className="relative flex size-2">
            {isLive && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:hidden" />
            )}
            <span className={cn('relative inline-flex size-2 rounded-full', isLive ? 'bg-accent' : 'bg-meter-foreground/30')} />
          </span>
          {isLive ? 'Live' : 'Idle'}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-wider text-meter-foreground/60 uppercase">Total register · kWh</span>
        {overview ? (
          <Odometer value={overview.currentReading} />
        ) : (
          <Skeleton className="h-14 w-72 bg-meter-foreground/10" />
        )}
      </div>

      <div className="mt-auto grid gap-4 border-t border-meter-foreground/15 pt-5 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-wider text-meter-foreground/60 uppercase">Drawing now</span>
          <p className="flex items-baseline gap-1.5" aria-live="polite">
            <span className="font-mono text-3xl font-semibold tabular-nums">{power.value}</span>
            <span className="text-sm text-meter-foreground/70">{power.unit}</span>
          </p>
          <span className="font-mono text-xs text-meter-foreground/50">
            {overview?.latestAt ? `Last reading ${formatTime(overview.latestAt)}` : 'No readings yet'}
          </span>
        </div>

        <div className="h-16 w-full" aria-hidden>
          {spark.length > 1 && (
            <ChartContainer config={sparkConfig} className="aspect-auto h-16 w-full">
              <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-powerWatts)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-powerWatts)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, 'dataMax']} />
                <Area
                  dataKey="powerWatts"
                  type="monotone"
                  stroke="var(--color-powerWatts)"
                  strokeWidth={1.5}
                  fill="url(#spark-fill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </article>
  )
}
