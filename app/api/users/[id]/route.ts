import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { firstname, email, password, level, status, nohape } = body

    const data: any = { firstname, email, level, status, nohape }
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
