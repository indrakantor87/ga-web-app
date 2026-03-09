import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toInt(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_satuan = toInt(id)
  if (!Number.isFinite(id_satuan)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const nama_satuan = String(body?.nama_satuan ?? '').trim()
  const is_active = body?.is_active != null ? String(body.is_active) : undefined

  if (!nama_satuan) return NextResponse.json({ error: 'Nama satuan wajib diisi' }, { status: 400 })

  await prisma.tbl_satuan.update({
    where: { id_satuan },
    data: {
      nama_satuan,
      ...(is_active ? { is_active: is_active === 'ZERO' ? 'ZERO' : 'ONE' } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_satuan = toInt(id)
  if (!Number.isFinite(id_satuan)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const is_active = String(body?.is_active ?? '')
  if (is_active !== 'ONE' && is_active !== 'ZERO') return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  await prisma.tbl_satuan.update({ where: { id_satuan }, data: { is_active } })
  return NextResponse.json({ ok: true })
}
