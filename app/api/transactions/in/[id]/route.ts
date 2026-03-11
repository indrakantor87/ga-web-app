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

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const old = await tx.tbl_barang_masuk.findUnique({ where: { id: recId } })
      if (!old) throw new Error('Data tidak ditemukan')

      const oldQty = Number(old.jumlah ?? 0)
      const newQty = Number(jumlah ?? 0)

      if (old.id_barang === id_barang) {
        const diff = newQty - oldQty
        if (diff > 0) {
          await tx.tbl_barang.update({ where: { id_barang }, data: { stok: { increment: diff } } })
        } else if (diff < 0) {
          const dec = Math.abs(diff)
          const updated = await tx.tbl_barang.updateMany({
            where: { id_barang, stok: { gte: dec } },
            data: { stok: { decrement: dec } },
          })
          if (updated.count === 0) throw new Error('Stok tidak mencukupi untuk mengurangi transaksi masuk')
        }
      } else {
        if (oldQty > 0) {
          const updated = await tx.tbl_barang.updateMany({
            where: { id_barang: old.id_barang, stok: { gte: oldQty } },
            data: { stok: { decrement: oldQty } },
          })
          if (updated.count === 0) throw new Error('Stok tidak mencukupi untuk memindahkan transaksi masuk')
        }
        await tx.tbl_barang.update({ where: { id_barang }, data: { stok: { increment: newQty } } })
      }

      await tx.tbl_barang_masuk.update({
        where: { id: recId },
        data: { id_barang, jumlah, tanggal, keterangan },
      })
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('stok tidak mencukupi')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    throw error
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const recId = toInt(id)
  if (!Number.isFinite(recId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const old = await tx.tbl_barang_masuk.findUnique({ where: { id: recId } })
      if (!old) throw new Error('Data tidak ditemukan')
      if (old.is_active === 'ZERO') return

      const qty = Number(old.jumlah ?? 0)
      if (qty > 0) {
        const updated = await tx.tbl_barang.updateMany({
          where: { id_barang: old.id_barang, stok: { gte: qty } },
          data: { stok: { decrement: qty } },
        })
        if (updated.count === 0) throw new Error('Stok tidak mencukupi untuk membatalkan barang masuk')
      }

      await tx.tbl_barang_masuk.update({ where: { id: recId }, data: { is_active: 'ZERO' } })
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('stok tidak mencukupi')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    throw error
  }

  return NextResponse.json({ ok: true })
}
