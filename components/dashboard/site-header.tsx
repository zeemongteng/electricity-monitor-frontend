'use client'

import { Zap } from 'lucide-react'
import type { Meter } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotificationsPopover } from './notifications-popover'
import { SettingsSheet } from './settings-sheet'

interface SiteHeaderProps {
  meters: Meter[]
  meter: Meter | null
  onSelectMeter: (id: number) => void
}

export function SiteHeader({ meters, meter, onSelectMeter }: SiteHeaderProps) {
  const items = meters.map((m) => ({ value: String(m.id), label: m.name }))

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Zap className="size-4" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">Wattline</span>
        </div>

        <div className="flex items-center gap-2">
          {meters.length > 1 ? (
            <Select
              items={items}
              value={meter ? String(meter.id) : null}
              onValueChange={(value) => value && onSelectMeter(Number(value))}
            >
              <SelectTrigger aria-label="Select meter" className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : meter ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">{meter.name}</span>
          ) : null}
          <NotificationsPopover />
          {meter && <SettingsSheet key={meter.id} meter={meter} />}
        </div>
      </div>
    </header>
  )
}
