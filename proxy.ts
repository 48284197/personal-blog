import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isProfileRoute = request.nextUrl.pathname.startsWith('/profile')
  const hasSession = Boolean(request.cookies.get('maoqiu_session')?.value)

  if ((isAdminRoute || isProfileRoute) && !hasSession) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
}
