'use client'

import { useState } from 'react'
import { useMeters } from '@/lib/hooks'
import { ActivateMeterPanel } from './activate-meter'
import { AlertWatcher } from './alert-watcher'
import { BackendStatus } from './backend-status'
import { BillCalculator } from './bill-calculator'
import { MeterFace } from './meter-face'
import { ReadingsTable } from './readings-table'
import { SiteHeader } from './site-header'
import { SimulatorPanel } from './simulator-panel'
import { UsageChart } from './usage-chart'
import { UsageStats } from './usage-stats'

export function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  const { data: meters, error, isLoading } = useMeters()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const meter = meters?.find((m) => m.id === selectedId) ?? meters?.[0] ?? null
  const meterId = meter?.id ?? null

  return (
    <div className="min-h-dvh">
      <SiteHeader meters={meters ?? []} meter={meter} onSelectMeter={setSelectedId} />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        {error && !meters ? (
          <BackendStatus error={error} />
        ) : !isLoading && meters && meters.length === 0 ? (
          isAdmin ? <BackendStatus empty /> : <ActivateMeterPanel onActivated={setSelectedId} />
        ) : (
          <>
            <section aria-label="Live meter" className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <MeterFace meterId={meterId} location={meter?.location ?? null} />
              </div>
              <div className="lg:col-span-5">
                <UsageStats meterId={meterId} />
              </div>
            </section>

            <UsageChart meterId={meterId} rate={meter?.ratePerKwh ?? 0} />

            <section aria-label="Tools" className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <BillCalculator meterId={meterId} defaultRate={meter?.ratePerKwh ?? 4} />
              </div>
              <div className="lg:col-span-5">
                <SimulatorPanel meterId={meterId} isAdmin={isAdmin} />
              </div>
            </section>

            <ReadingsTable meterId={meterId} />
          </>
        )}
      </main>

      <AlertWatcher />
    </div>
  )
}
