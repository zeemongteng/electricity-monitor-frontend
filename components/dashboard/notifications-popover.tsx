'use client'

import { Bell } from 'lucide-react'
import { actions, refreshAll, type NotificationKind } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { useNotifications } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const KIND_LABEL: Record<NotificationKind, string> = {
  SPIKE: 'Power spike',
  HOURLY_HIGH: 'High hour',
  BUDGET: 'Daily budget passed',
}

export function NotificationsPopover() {
  const { data } = useNotifications()
  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon" className="relative" aria-label={`Alerts, ${unread} unread`} />
        }
      >
        <Bell aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <Button
            variant="ghost"
            size="xs"
            disabled={unread === 0}
            onClick={() => actions.markAllRead().then(refreshAll)}
          >
            Mark all read
          </Button>
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {!data?.length && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No alerts yet.</li>}
          {data?.map((n) => (
            <li key={n.id} className="border-b last:border-b-0">
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted',
                  n.read && 'opacity-60',
                )}
                onClick={() => !n.read && actions.markRead(n.id).then(refreshAll)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {!n.read && <span className="size-1.5 rounded-full bg-accent ring-2 ring-accent/30" aria-hidden />}
                    {KIND_LABEL[n.kind]}
                    {!n.read && <span className="sr-only">(unread)</span>}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                </span>
                <span className="text-sm leading-snug text-pretty">{n.message}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
