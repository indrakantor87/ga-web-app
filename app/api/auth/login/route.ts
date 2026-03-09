import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-perkasa-networks')

export async function POST(req: Request) {
  try {
    const { email, password, remember } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    if (!email.endsWith('@perkasa.net.id')) {
      return NextResponse.json({ error: 'Email harus menggunakan domain @perkasa.net.id' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('Login failed: User not found', email)
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    if (user.status !== 'aktif') {
      console.log('Login failed: User inactive', email)
      return NextResponse.json({ error: 'Akun dinonaktifkan' }, { status: 403 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      console.log('Login failed: Invalid password', email)
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Create Session/Token
    const token = await new SignJWT({
      id: user.user_id,
      email: user.email,
      name: user.firstname,
      role: user.level,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(remember ? '30d' : '24h') // 30 hari jika ingat saya, 24 jam jika tidak
      .sign(SECRET_KEY)

    const response = NextResponse.json({ ok: true })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // Detik
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
