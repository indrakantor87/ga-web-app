import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toInt(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_barang = toInt(id)
  if (!Number.isFinite(id_barang)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))

  const kd_barang = String(body?.kd_barang ?? '').trim()
  const barcode = String(body?.barcode ?? '').trim()
  const nama_barang = String(body?.nama_barang ?? '').trim()
  const harga = Number(body?.harga ?? 0)
  const id_jenis = Number(body?.id_jenis ?? NaN)
  const id_satuan = Number(body?.id_satuan ?? NaN)
  const stok_minimum = Number(body?.stok_minimum ?? 0)
  let foto = body?.foto != null && String(body.foto).trim() ? String(body.foto).trim() : null
  const is_active = body?.is_active != null ? String(body.is_active) : undefined

  if (foto && foto.startsWith('/uploads/')) foto = foto.slice('/uploads/'.length)
  if (foto && foto.length > 100) foto = foto.slice(0, 100)

  if (!kd_barang || !nama_barang) return NextResponse.json({ error: 'Kode barang dan nama barang wajib diisi' }, { status: 400 })
  if (!Number.isFinite(harga) || harga < 0) return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 })
  if (!Number.isFinite(id_jenis) || !Number.isFinite(id_satuan)) return NextResponse.json({ error: 'Jenis dan satuan wajib dipilih' }, { status: 400 })
  if (!Number.isFinite(stok_minimum) || stok_minimum < 0) return NextResponse.json({ error: 'Stok minimum tidak valid' }, { status: 400 })
  if (!barcode) return NextResponse.json({ error: 'Barcode wajib diisi' }, { status: 400 })

  await prisma.tbl_barang.update({
    where: { id_barang },
    data: {
      kd_barang,
      barcode,
      nama_barang,
      harga,
      id_jenis,
      id_satuan,
      stok_minimum,
      foto,
      ...(is_active ? { is_active: is_active === 'ZERO' ? 'ZERO' : 'ONE' } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_barang = toInt(id)
  if (!Number.isFinite(id_barang)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const is_active = String(body?.is_active ?? '')
  if (is_active !== 'ONE' && is_active !== 'ZERO') return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  await prisma.tbl_barang.update({ where: { id_barang }, data: { is_active } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const id_barang = toInt(id)
  if (!Number.isFinite(id_barang)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await prisma.tbl_barang.update({ where: { id_barang }, data: { is_active: 'ZERO' } })
  return NextResponse.json({ ok: true })
}
