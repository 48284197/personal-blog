type CookieValue = { value: string } | undefined

function parseCookies(header: string | null) {
  const values = new Map<string, string>()
  for (const part of header?.split(';') ?? []) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    values.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()))
  }
  return values
}

export type AppRequest = Request & {
  nextUrl: URL
  cookies: {
    get(name: string): CookieValue
  }
}

export function toAppRequest(request: Request): AppRequest {
  const cookies = parseCookies(request.headers.get('cookie'))
  return Object.assign(request, {
    nextUrl: new URL(request.url),
    cookies: {
      get(name: string) {
        const value = cookies.get(name)
        return value === undefined ? undefined : { value }
      },
    },
  })
}

export const AppResponse = Response

export function invokeHandler(
  handler: (...args: never[]) => Response | Promise<Response>,
  request: Request,
  params: Record<string, unknown>,
) {
  return handler(
    toAppRequest(request) as never,
    { params: Promise.resolve(params) } as never,
  )
}
