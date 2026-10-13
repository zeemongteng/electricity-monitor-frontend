import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { listUsers } from '@/app/actions/users'
import { UsersTable } from '@/components/admin/users-table'
import { Brand, NavTabs, UserMenu } from '@/components/app-nav'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Users — Wattline',
  description: 'Manage Wattline accounts and admin access.',
}

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if (session.user.role !== 'admin') redirect('/')

  const users = await listUsers()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4 md:gap-6">
            <Brand />
            <NavTabs />
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Users</h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Everyone with a Wattline account. Promote trusted people, such as dorm owners, to admin so they can manage buildings and rooms.
          </p>
        </div>
        <UsersTable users={users} currentUserId={session.user.id} />
      </main>
    </div>
  )
}
