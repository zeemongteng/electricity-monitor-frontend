'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Gauge,
  KeyRound,
  MapPinned,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Step {
  icon: LucideIcon
  eyebrow: string
  title: string
  body: string
  tips: string[]
}

const TENANT_STEPS: Step[] = [
  {
    icon: MapPinned,
    eyebrow: 'Coverage map',
    title: 'Find your building',
    body: 'Open the Coverage map tab and search or browse for your dorm or apartment. A pin means Wattline meters are installed there.',
    tips: ['Click a pin to see the address and how many rooms are metered.', 'No pin yet? Ask your dorm owner to get in touch.'],
  },
  {
    icon: KeyRound,
    eyebrow: 'From your dorm owner',
    title: 'Get your device ID and password',
    body: 'When you move in, your dorm owner gives you a device ID and password for the meter in your room.',
    tips: ['The device ID looks like WL-XXXXXX.', 'Keep the password private. Anyone with it could claim your meter.'],
  },
  {
    icon: Gauge,
    eyebrow: 'Dashboard',
    title: 'Activate your meter',
    body: 'On the Dashboard, enter the device ID and password to link the meter to your account. Only you can see its readings.',
    tips: ['Have more than one room? Use “Add meter” in the header.'],
  },
  {
    icon: Building2,
    eyebrow: 'Every day',
    title: 'Track usage and your bill',
    body: 'See live power, kWh used today and this month, and a projected bill. Set your price per kWh and daily budget in Settings.',
    tips: ['Use the appliance calculator to see what each device costs you per month.'],
  },
]

const ADMIN_STEP: Step = {
  icon: ShieldCheck,
  eyebrow: 'Admin tools',
  title: 'Manage buildings, rooms and people',
  body: 'As an admin you can add buildings to the map, issue a device ID and password for each room, and manage who else is an admin.',
  tips: [
    'On the map, click “Add location”, then click the map to drop a pin.',
    'Open a building and use “Manage rooms” to issue credentials.',
    'Use the Users tab to promote someone to admin.',
  ],
}

interface OnboardingGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
}

export function OnboardingGuide({ open, onOpenChange, isAdmin }: OnboardingGuideProps) {
  const steps = isAdmin ? [...TENANT_STEPS, ADMIN_STEP] : TENANT_STEPS
  const [index, setIndex] = useState(0)
  const step = steps[Math.min(index, steps.length - 1)]
  const isLast = index >= steps.length - 1
  const Icon = step.icon

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setIndex(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex flex-col gap-4 border-b bg-secondary/40 px-6 pb-5 pt-6">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {index + 1} / {steps.length}
            </span>
          </div>
          <DialogHeader className="gap-1.5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{step.eyebrow}</p>
            <DialogTitle className="text-xl text-balance">{step.title}</DialogTitle>
            <DialogDescription className="leading-relaxed text-pretty">{step.body}</DialogDescription>
          </DialogHeader>
        </div>

        <ul className="flex flex-col gap-2.5 px-6 py-5">
          {step.tips.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-accent' : 'w-1.5 bg-muted-foreground/30',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Skip
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Get started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
                Next
                <ArrowRight aria-hidden />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
