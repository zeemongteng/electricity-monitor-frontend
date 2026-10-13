import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/dashboard/dashboard'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/map')

  return <Dashboard isAdmin={session.user.role === 'admin'} />
}
