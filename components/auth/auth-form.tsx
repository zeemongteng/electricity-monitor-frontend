'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setPending(false)
    if (error) {
      setError(
        isSignUp
          ? 'Could not create the account. Try a different email or a longer password.'
          : 'Email or password is incorrect.',
      )
      return
    }
    router.push(next)
    router.refresh()
  }

  const otherHref = `${isSignUp ? '/sign-in' : '/sign-up'}${next !== '/map' ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link href="/" className="flex items-center gap-2 self-center">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Zap className="size-4" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">Wattline</span>
        </Link>

        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {isSignUp
                ? 'Register to check whether your dorm or apartment has a Wattline meter installed.'
                : 'Sign in to view the coverage map of buildings with Wattline meters.'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <FieldGroup>
              {isSignUp && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" name="name" autoComplete="name" required maxLength={80} />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
              </Field>
            </FieldGroup>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : 'New to Wattline? '}
          <Link href={otherHref} className="font-medium text-primary underline-offset-4 hover:underline">
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </main>
  )
}

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/map'
}
