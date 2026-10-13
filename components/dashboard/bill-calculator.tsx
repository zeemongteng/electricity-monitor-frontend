'use client'

import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { formatBaht } from '@/lib/format'
import { useOverview } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Appliance {
  id: number
  name: string
  watts: number
  hours: number
  qty: number
}

const PRESETS: Omit<Appliance, 'id'>[] = [
  { name: 'Air conditioner', watts: 1200, hours: 8, qty: 1 },
  { name: 'Refrigerator', watts: 150, hours: 24, qty: 1 },
  { name: 'LED lights', watts: 10, hours: 6, qty: 8 },
  { name: 'Television', watts: 100, hours: 4, qty: 1 },
  { name: 'Rice cooker', watts: 700, hours: 1, qty: 1 },
]

let nextId = PRESETS.length

const monthlyKwh = (a: Appliance, days: number) => (a.watts * a.hours * a.qty * days) / 1000

export function BillCalculator({ meterId, defaultRate }: { meterId: number | null; defaultRate: number }) {
  const baseId = useId()
  const { data: overview } = useOverview(meterId)
  const [items, setItems] = useState<Appliance[]>(() => PRESETS.map((p, i) => ({ ...p, id: i })))
  const [days, setDays] = useState(30)
  const [rateInput, setRateInput] = useState<string | null>(null)

  const rate = rateInput === null ? defaultRate : Number(rateInput) || 0
  const totalKwh = items.reduce((sum, a) => sum + monthlyKwh(a, days), 0)
  const totalCost = totalKwh * rate
  const share = overview?.projectedMonthKwh ? Math.min(100, (totalKwh / overview.projectedMonthKwh) * 100) : null

  function update(id: number, patch: Partial<Appliance>) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  return (
    <section aria-labelledby={`${baseId}-title`} className="flex h-full flex-col rounded-xl border bg-card">
      <header className="flex flex-col gap-0.5 border-b px-5 py-4">
        <h2 id={`${baseId}-title`} className="text-sm font-semibold">
          Appliance bill calculator
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Estimate what each appliance adds to your monthly bill.
        </p>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="hidden grid-cols-[1fr_5.5rem_4.5rem_4rem_5.5rem_2rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>Appliance</span>
          <span>Watts</span>
          <span>Hrs/day</span>
          <span>Qty</span>
          <span className="text-right">kWh/mo</span>
          <span className="sr-only">Remove</span>
        </div>

        <ul className="flex flex-col gap-3 sm:gap-2">
          {items.map((a) => {
            const rowId = `${baseId}-${a.id}`
            return (
              <li
                key={a.id}
                className="grid grid-cols-3 items-center gap-2 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_5.5rem_4.5rem_4rem_5.5rem_2rem] sm:border-b-0 sm:pb-0"
              >
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor={`${rowId}-name`} className="sr-only">
                    Appliance name
                  </Label>
                  <Input id={`${rowId}-name`} value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} />
                </div>
                <div className="flex items-center justify-end gap-1 sm:hidden">
                  <span className="font-mono text-sm tabular-nums">{monthlyKwh(a, days).toFixed(1)} kWh</span>
                  <RemoveButton name={a.name} onClick={() => setItems((p) => p.filter((x) => x.id !== a.id))} />
                </div>
                <NumberCell id={`${rowId}-w`} label="Watts" value={a.watts} onChange={(v) => update(a.id, { watts: v })} />
                <NumberCell
                  id={`${rowId}-h`}
                  label="Hours per day"
                  value={a.hours}
                  max={24}
                  step={0.5}
                  onChange={(v) => update(a.id, { hours: v })}
                />
                <NumberCell id={`${rowId}-q`} label="Quantity" value={a.qty} onChange={(v) => update(a.id, { qty: v })} />
                <span className="hidden text-right font-mono text-sm tabular-nums sm:block">
                  {monthlyKwh(a, days).toFixed(1)}
                </span>
                <span className="hidden sm:block">
                  <RemoveButton name={a.name} onClick={() => setItems((p) => p.filter((x) => x.id !== a.id))} />
                </span>
              </li>
            )
          })}
        </ul>

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setItems((p) => [...p, { id: nextId++, name: 'New appliance', watts: 100, hours: 1, qty: 1 }])}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Add appliance
        </Button>
      </div>

      <footer className="mt-auto flex flex-col gap-4 border-t bg-muted/50 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <div className="flex w-24 flex-col gap-1.5">
            <Label htmlFor={`${baseId}-days`} className="text-xs text-muted-foreground">
              Days / month
            </Label>
            <Input
              id={`${baseId}-days`}
              type="number"
              min={1}
              max={31}
              value={days}
              onChange={(e) => setDays(Math.min(31, Math.max(0, Number(e.target.value) || 0)))}
              className="bg-card font-mono"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label htmlFor={`${baseId}-rate`} className="text-xs text-muted-foreground">
              THB / kWh
            </Label>
            <Input
              id={`${baseId}-rate`}
              type="number"
              min={0}
              step="0.01"
              value={rateInput ?? String(defaultRate)}
              onChange={(e) => setRateInput(e.target.value)}
              className="bg-card font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-0.5 sm:items-end" aria-live="polite">
          <span className="text-xs text-muted-foreground">
            {totalKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh per month
            {share !== null && ` · ${share.toFixed(0)}% of your projected use`}
          </span>
          <span className="font-mono text-3xl font-semibold tabular-nums">{formatBaht(totalCost)}</span>
        </div>
      </footer>
    </section>
  )
}

function NumberCell({
  id,
  label,
  value,
  onChange,
  max,
  step = 1,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
  step?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground sm:sr-only">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Math.max(0, Number(e.target.value) || 0)
          onChange(max ? Math.min(max, n) : n)
        }}
        className="font-mono"
      />
    </div>
  )
}

function RemoveButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={onClick}>
      <X aria-hidden />
    </Button>
  )
}
