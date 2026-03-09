import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toInt(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_jenis = toInt(id)
  if (!Number.isFinite(id_jenis)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const nama_jenis = String(body?.nama_jenis ?? '').trim()
  const is_active = body?.is_active != null ? String(body.is_active) : undefined

  if (!nama_jenis) return NextResponse.json({ error: 'Nama jenis wajib diisi' }, { status: 400 })

  await prisma.tbl_jenis.update({
    where: { id_jenis },
    data: {
      nama_jenis,
      ...(is_active ? { is_active: is_active === 'ZERO' ? 'ZERO' : 'ONE' } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_jenis = toInt(id)
  if (!Number.isFinite(id_jenis)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const is_active = String(body?.is_active ?? '')
  if (is_active !== 'ONE' && is_active !== 'ZERO') return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  await prisma.tbl_jenis.update({ where: { id_jenis }, data: { is_active } })
  return NextResponse.json({ ok: true })
}
