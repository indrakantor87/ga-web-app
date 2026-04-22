import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-perkasa-networks')

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const user = {
      id: Number(payload.id),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: String(payload.role ?? ''),
    }
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

