'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ActivateMeterForm } from './activate-meter'

export function AddMeterDialog({ onActivated }: { onActivated: (meterId: number) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label="Link another meter" />}>
        <Plus />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link another meter</DialogTitle>
          <DialogDescription>Enter the device ID and password from your dorm owner.</DialogDescription>
        </DialogHeader>
        <ActivateMeterForm
          onActivated={(id) => {
            setOpen(false)
            onActivated(id)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
