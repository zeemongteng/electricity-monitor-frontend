import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { auth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Sign in — Wattline' }

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/map')
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  )
}
