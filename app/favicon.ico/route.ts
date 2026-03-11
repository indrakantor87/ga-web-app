import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  url.pathname = '/favicon.png'
  url.searchParams.set('v', '2')
  return NextResponse.redirect(url, 308)
}
