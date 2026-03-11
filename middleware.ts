import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-perkasa-networks')

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Halaman publik yang tidak butuh login
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (token && pathname.startsWith('/login')) {
      try {
        await jwtVerify(token, SECRET_KEY)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (e) {
        // Token invalid, let them login
      }
    }
    return NextResponse.next()
  }

  // Cek token untuk halaman lain
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET_KEY)
    return NextResponse.next()
  } catch (error) {
    // Token expired or invalid
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|uploads).*)',
  ],
}
