import type { NextRequest } from 'next/server'
import { backendFetch, getAccess, type Access } from '@/lib/access'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ path: string[] }> }

interface BackendNotification {
  id: number
  meterId: number
  read: boolean
}

const deny = (status: 401 | 403, message: string) =>
  Response.json({ code: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message }, { status })

function relay(upstream: Response, body: string) {
  return new Response(upstream.status === 204 || !body ? null : body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

function parseMeterId(body: string) {
  try {
    return (JSON.parse(body) as { meterId?: unknown }).meterId
  } catch {
    return undefined
  }
}

/** Returns null when allowed, otherwise the reason to reject. */
function authorize(access: Access, method: string, path: string[], query: URLSearchParams, body: string) {
  const [resource, id, sub] = path
  const admin = access.isAdmin

  switch (resource) {
    case 'meters':
      if (!id) return method === 'GET' || admin ? null : 'Only admins can create meters.'
      return access.canUse(id) ? null : 'You don’t have access to this meter.'
    case 'usage':
      return access.canUse(query.get('meterId')) ? null : 'You don’t have access to this meter.'
    case 'readings':
      return access.canUse(method === 'GET' ? query.get('meterId') : parseMeterId(body))
        ? null
        : 'You don’t have access to this meter.'
    case 'notifications':
      return null // filtered / verified per item below
    case 'simulator':
      if (!id) return null
      if (id === 'manual' || id === 'history') return access.canUse(parseMeterId(body)) ? null : 'You don’t have access to this meter.'
      if (id === 'sample') return access.canUse(query.get('meterId')) ? null : 'You don’t have access to this meter.'
      return admin ? null : 'Only admins can change the shared simulator.'
    default:
      return admin && !sub ? null : 'Not allowed.'
  }
}

async function proxy(request: NextRequest, { params }: Context) {
  if (!process.env.BACKEND_URL) {
    return Response.json(
      { code: 'NOT_CONFIGURED', message: 'BACKEND_URL is not set for this project.' },
      { status: 503 },
    )
  }

  const access = await getAccess(request.headers)
  if (!access) return deny(401, 'Sign in to view meter data.')

  const { path } = await params
  const method = request.method
  const query = request.nextUrl.searchParams
  const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : ''

  const reason = authorize(access, method, path, query, body)
  if (reason) return deny(403, reason)

  const target = `/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`

  try {
    // Non-admins only see their own meters and alerts.
    if (!access.isAdmin && method === 'GET' && path.length === 1 && (path[0] === 'meters' || path[0] === 'notifications')) {
      const upstream = await backendFetch(target)
      if (!upstream.ok) return relay(upstream, await upstream.text())
      const items = (await upstream.json()) as Array<{ id: number; meterId?: number }>
      const key = path[0] === 'meters' ? 'id' : 'meterId'
      return Response.json(items.filter((item) => access.meterIds.has(Number(item[key]))))
    }

    if (!access.isAdmin && path[0] === 'notifications' && method !== 'GET') {
      const listRes = await backendFetch('/api/notifications')
      if (!listRes.ok) return relay(listRes, await listRes.text())
      const own = ((await listRes.json()) as BackendNotification[]).filter((n) => access.meterIds.has(n.meterId))

      if (path[1] === 'read-all') {
        await Promise.all(own.filter((n) => !n.read).map((n) => backendFetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })))
        return new Response(null, { status: 204 })
      }
      if (!own.some((n) => String(n.id) === path[1])) return deny(403, 'You don’t have access to this alert.')
    }

    const upstream = await backendFetch(target, { method, body: body || undefined })
    return relay(upstream, await upstream.text())
  } catch {
    return Response.json(
      { code: 'UNREACHABLE', message: 'The backend did not respond. It may be waking up.' },
      { status: 502 },
    )
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
