import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ path: string[] }> }

async function proxy(request: NextRequest, { params }: Context) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    return Response.json(
      { code: 'NOT_CONFIGURED', message: 'BACKEND_URL is not set for this project.' },
      { status: 503 },
    )
  }

  const { path } = await params
  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, backendUrl)
  target.search = request.nextUrl.search

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        accept: 'application/json',
        'content-type': request.headers.get('content-type') ?? 'application/json',
      },
      body: hasBody ? await request.text() : undefined,
      cache: 'no-store',
      // Render free instances can take ~60s to wake from sleep.
      signal: AbortSignal.timeout(75_000),
    })

    const body = await upstream.text()
    return new Response(upstream.status === 204 || !body ? null : body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    })
  } catch {
    return Response.json(
      { code: 'UNREACHABLE', message: 'The backend did not respond. It may be waking up.' },
      { status: 502 },
    )
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
