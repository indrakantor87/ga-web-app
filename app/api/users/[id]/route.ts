import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Prisma, users_level, users_status } from '@prisma/client'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { firstname, email, password, level, status, nohape } = body

    const data: Prisma.usersUpdateInput = {
      firstname: String(firstname ?? '').trim(),
      email: String(email ?? '').trim(),
      level: (String(level ?? '').trim() as users_level) || undefined,
      status: (String(status ?? '').trim() as users_status) || undefined,
      nohape: String(nohape ?? '').trim(),
    }
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.users.update({
      where: { user_id: Number(id) },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal update user' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.users.delete({
      where: { user_id: Number(id) },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal hapus user' }, { status: 500 })
  }
}
