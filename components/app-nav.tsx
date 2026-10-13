'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { authClient, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Dashboard' },
  { href: '/map', label: 'Coverage map' },
]

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Zap className="size-4" aria-hidden />
      </span>
      <span className="font-semibold tracking-tight">Wattline</span>
    </Link>
  )
}

export function NavTabs() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function UserMenu() {
  const router = useRouter()
  const { data, isPending } = useSession()

  if (isPending) return <div className="h-8 w-20 animate-pulse rounded-md bg-secondary" aria-hidden />

  if (!data?.user) {
    return (
      <Link href="/sign-in" className={buttonVariants({ variant: 'outline' })}>
        Sign in
      </Link>
    )
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-32 truncate text-sm text-muted-foreground md:inline">{data.user.name}</span>
      {data.user.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
      <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
        <LogOut />
      </Button>
    </div>
  )
}
