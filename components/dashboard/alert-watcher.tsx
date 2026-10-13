'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { actions, refreshAll } from '@/lib/api'
import { useNotifications } from '@/lib/hooks'
import { KIND_LABEL } from './notifications-popover'

export function AlertWatcher() {
  const { data } = useNotifications()
  const seen = useRef<Set<number> | null>(null)

  useEffect(() => {
    if (!data) return
    if (!seen.current) {
      seen.current = new Set(data.map((n) => n.id))
      return
    }
    for (const n of [...data].reverse()) {
      if (seen.current.has(n.id)) continue
      seen.current.add(n.id)
      if (n.read) continue
      toast.warning(KIND_LABEL[n.kind], {
        description: n.message,
        action: {
          label: 'Mark read',
          onClick: () => actions.markRead(n.id).then(refreshAll),
        },
      })
    }
  }, [data])

  return null
}
