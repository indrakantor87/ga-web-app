import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const users = await prisma.users.findMany({
    select: {
      user_id: true,
      firstname: true,
      email: true,
      level: true,
      status: true,
      nohape: true,
    },
    orderBy: { user_id: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstname, email, password, level, nohape } = body

    if (!firstname || !email || !password || !level) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.users.create({
      data: {
        firstname,
        email,
        password: hashedPassword,
        level,
        nohape: nohape || '-',
        status: 'aktif',
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 })
  }
}
