import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/log', '/history'] as const

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (!isProtected) return NextResponse.next()

  if (!req.auth)
    return NextResponse.redirect(new URL('/login', req.url))

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
