import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function toInt(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const recId = toInt(id)
  if (!Number.isFinite(recId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const id_barang = Number(body?.id_barang ?? NaN)
  const jumlah = Number(body?.jumlah ?? NaN)
  const tanggal = body?.tanggal ? new Date(String(body.tanggal)) : new Date()
  const keterangan = String(body?.keterangan ?? '').trim()

  if (!Number.isFinite(id_barang) || !Number.isFinite(jumlah) || jumlah <= 0) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const old = await tx.tbl_barang_masuk.findUnique({ where: { id: recId } })
    if (!old) throw new Error('Data tidak ditemukan')

    // Reconcile stok
    if (old.id_barang === id_barang) {
      const delta = (jumlah ?? 0) - (old.jumlah ?? 0)
      if (delta !== 0) {
        await tx.tbl_barang.update({ where: { id_barang }, data: { stok: { increment: delta } } })
      }
    } else {
      // pindah barang: kurangi stok lama, tambah stok baru
      if (old.jumlah) {
        await tx.tbl_barang.update({ where: { id_barang: old.id_barang }, data: { stok: { decrement: old.jumlah } } })
      }
      await tx.tbl_barang.update({ where: { id_barang }, data: { stok: { increment: jumlah } } })
    }

    await tx.tbl_barang_masuk.update({
      where: { id: recId },
      data: { id_barang, jumlah, tanggal, keterangan },
    })
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const recId = toInt(id)
  if (!Number.isFinite(recId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const old = await tx.tbl_barang_masuk.findUnique({ where: { id: recId } })
    if (!old) throw new Error('Data tidak ditemukan')
    if (old.is_active === 'ZERO') return

    // Revert stok
    if (old.jumlah) {
      await tx.tbl_barang.update({ where: { id_barang: old.id_barang }, data: { stok: { decrement: old.jumlah } } })
    }
    await tx.tbl_barang_masuk.update({ where: { id: recId }, data: { is_active: 'ZERO' } })
  })

  return NextResponse.json({ ok: true })
}
