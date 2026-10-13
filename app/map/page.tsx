import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLocations } from '@/app/actions/locations'
import { CoverageMap } from '@/components/map/coverage-map'
import { Brand, NavTabs, UserMenu } from '@/components/app-nav'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Coverage map — Wattline',
  description: 'Check whether your dorm or apartment has a Wattline electricity meter installed.',
}

export default async function MapPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in?next=/map')

  const locations = await getLocations()

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-30 shrink-0 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4 md:gap-6">
            <Brand />
            <NavTabs />
          </div>
          <UserMenu />
        </div>
      </header>
      <CoverageMap
        locations={locations.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() }))}
        isAdmin={session.user.role === 'admin'}
      />
    </div>
  )
}
