'use client'

import { Settings2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { actions, refreshAll, type Meter } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'

export function SettingsSheet({ meter }: { meter: Meter }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alertsEnabled, setAlertsEnabled] = useState(meter.alertsEnabled)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await actions.updateMeter(meter.id, {
        name: String(form.get('name') ?? '').trim(),
        ratePerKwh: Number(form.get('rate')),
        dailyBudgetKwh: Number(form.get('budget')),
        alertMultiplier: Number(form.get('multiplier')),
        alertsEnabled,
      })
      await refreshAll()
      toast.success('Meter settings saved')
      setOpen(false)
    } catch (error) {
      toast.error('Could not save settings', { description: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Meter settings" />}>
        <Settings2 aria-hidden />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Meter settings</SheetTitle>
            <SheetDescription>Tariff and alert rules used for cost estimates and pop-ups.</SheetDescription>
          </SheetHeader>

          <FieldGroup className="flex-1 overflow-y-auto px-4">
            <Field>
              <FieldLabel htmlFor="name">Meter name</FieldLabel>
              <Input id="name" name="name" defaultValue={meter.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="rate">Rate per kWh (THB)</FieldLabel>
              <Input id="rate" name="rate" type="number" min={0} step="0.01" defaultValue={meter.ratePerKwh} required />
              <FieldDescription>Used for every cost figure on the dashboard.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="budget">Daily budget (kWh)</FieldLabel>
              <Input id="budget" name="budget" type="number" min={0} step="0.1" defaultValue={meter.dailyBudgetKwh} required />
              <FieldDescription>Alert once today passes this. Set 0 to turn off.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="multiplier">Alert above × average</FieldLabel>
              <Input
                id="multiplier"
                name="multiplier"
                type="number"
                min={1}
                step="0.1"
                defaultValue={meter.alertMultiplier}
                required
              />
              <FieldDescription>Spikes and high hours trigger when usage passes this multiple of normal.</FieldDescription>
            </Field>
            <Field orientation="horizontal" className="justify-between rounded-lg border p-3">
              <FieldLabel htmlFor="alerts">Usage alerts</FieldLabel>
              <Switch id="alerts" checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </Field>
          </FieldGroup>

          <SheetFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
