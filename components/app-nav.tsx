'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CircleHelp, LogOut, Zap } from 'lucide-react'
import { markOnboarded } from '@/app/actions/users'
import { OnboardingGuide } from '@/components/onboarding-guide'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { authClient, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Dashboard', adminOnly: false },
  { href: '/map', label: 'Coverage map', adminOnly: false },
  { href: '/admin/users', label: 'Users', adminOnly: true },
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
  const { data } = useSession()
  const isAdmin = data?.user.role === 'admin'

  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {TABS.filter((tab) => !tab.adminOnly || isAdmin).map((tab) => {
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
  const [manualOpen, setManualOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const needsOnboarding = Boolean(data?.user && !data.user.onboardedAt) && !dismissed
  const guideOpen = manualOpen || needsOnboarding

  function handleGuideChange(open: boolean) {
    setManualOpen(open)
    if (!open && needsOnboarding) {
      setDismissed(true)
      void markOnboarded()
    }
  }

  const helpButton = (
    <>
      <Button variant="ghost" size="icon" onClick={() => setManualOpen(true)} aria-label="How Wattline works">
        <CircleHelp />
      </Button>
      <OnboardingGuide
        open={guideOpen}
        onOpenChange={handleGuideChange}
        isAdmin={data?.user.role === 'admin'}
      />
    </>
  )

  if (isPending) return <div className="h-8 w-20 animate-pulse rounded-md bg-secondary" aria-hidden />

  if (!data?.user) {
    return (
      <div className="flex items-center gap-2">
        {helpButton}
        <Link href="/sign-in" className={buttonVariants({ variant: 'outline' })}>
          Sign in
        </Link>
      </div>
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
      {helpButton}
      <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
        <LogOut />
      </Button>
    </div>
  )
}
