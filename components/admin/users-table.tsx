'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { setUserRole, type Role, type UserRow } from '@/app/actions/users'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface UsersTableProps {
  users: UserRow[]
  currentUserId: string
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<{ user: UserRow; role: Role } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query])

  const adminCount = users.filter((u) => u.role === 'admin').length

  function confirmChange() {
    if (!pending) return
    const { user, role } = pending
    startTransition(async () => {
      const result = await setUserRole(user.id, role)
      if (result.ok) {
        toast.success(role === 'admin' ? `${user.name} is now an admin` : `${user.name} is no longer an admin`)
        setPending(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{users.length}</span> accounts ·{' '}
          <span className="font-mono tabular-nums text-foreground">{adminCount}</span> admin
          {adminCount === 1 ? '' : 's'}
        </p>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            className="pl-8"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Meters</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No users match “{query}”.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 truncate font-medium">
                          {u.name}
                          {isSelf && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {dateFormat.format(new Date(u.createdAt))}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono tabular-nums sm:table-cell">{u.meters}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge className="bg-accent text-accent-foreground hover:bg-accent">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Tenant</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? null : u.role === 'admin' ? (
                        <Button variant="ghost" size="sm" onClick={() => setPending({ user: u, role: 'user' })}>
                          <ShieldOff aria-hidden />
                          Remove admin
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setPending({ user: u, role: 'admin' })}>
                          <ShieldCheck aria-hidden />
                          Make admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && !isPending && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.role === 'admin' ? `Make ${pending?.user.name} an admin?` : `Remove admin from ${pending?.user.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.role === 'admin'
                ? 'Admins can add and edit buildings on the map, issue room credentials, see every meter, and change other users’ roles.'
                : 'They will go back to a regular tenant account and only see meters they have activated.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                confirmChange()
              }}
            >
              {isPending ? 'Saving…' : pending?.role === 'admin' ? 'Make admin' : 'Remove admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
