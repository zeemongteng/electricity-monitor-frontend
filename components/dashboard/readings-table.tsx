'use client'

import { useMemo } from 'react'
import type { ReadingSource } from '@/lib/api'
import { formatDateTime, parseLocal } from '@/lib/format'
import { useReadings } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SOURCE_STYLE: Record<ReadingSource, string> = {
  AUTO: 'bg-muted text-muted-foreground',
  MANUAL: 'bg-accent text-accent-foreground',
  HISTORY: 'bg-secondary text-secondary-foreground',
  DEVICE: 'bg-primary text-primary-foreground',
}

const num = (value: number, digits: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export function ReadingsTable({ meterId }: { meterId: number | null }) {
  const { data, isLoading } = useReadings(meterId)

  const rows = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => parseLocal(b.recordedAt).getTime() - parseLocal(a.recordedAt).getTime())
        .slice(0, 15),
    [data],
  )

  return (
    <section aria-labelledby="readings-title" className="rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 id="readings-title" className="text-sm font-semibold">
          Recent readings
        </h2>
        <span className="text-xs text-muted-foreground">Latest {rows.length}</span>
      </header>

      {isLoading && !data ? (
        <div className="p-5">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No readings yet. Turn on auto readings or add one manually.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Time</TableHead>
              <TableHead className="text-right">Power</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Duration</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead className="hidden text-right md:table-cell">Register</TableHead>
              <TableHead className="pr-5 text-right">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs tabular-nums">
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pl-5 font-sans">{formatDateTime(r.recordedAt)}</TableCell>
                <TableCell className="text-right">{num(r.powerWatts, 0)} W</TableCell>
                <TableCell className="hidden text-right sm:table-cell">{num(r.durationSeconds, 0)} s</TableCell>
                <TableCell className="text-right">{num(r.usedKwh * 1000, 1)} Wh</TableCell>
                <TableCell className="hidden text-right md:table-cell">{num(r.cumulativeKwh, 2)} kWh</TableCell>
                <TableCell className="pr-5 text-right">
                  <span className={cn('rounded px-1.5 py-0.5 font-sans text-[11px] font-medium', SOURCE_STYLE[r.source])}>
                    {r.source.toLowerCase()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
