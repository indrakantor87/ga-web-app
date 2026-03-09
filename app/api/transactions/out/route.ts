import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function toInt(v: string | null, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function csvEscapeCell(v: unknown) {
  const s = v == null ? '' : String(v)
  const needsQuote = /[",\n]/.test(s)
  const inner = s.replaceAll('"', '""')
  return needsQuote ? `"${inner}"` : inner
}

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] ?? {})
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => csvEscapeCell(r[h])).join(','))]
  return lines.join('\n')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const pageSize = Math.min(100, Math.max(5, toInt(url.searchParams.get('pageSize'), 10)))
  const exportCsv = url.searchParams.get('export') === 'csv'

  const startDate = start ? new Date(start) : null
  const endExclusive = end ? new Date(new Date(end).setDate(new Date(end).getDate() + 1)) : null
  const like = q ? `%${q}%` : null

  const totalRows = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total
    FROM tbl_barang_keluar bk
    LEFT JOIN tbl_barang b ON b.id_barang = bk.id_barang
    WHERE bk.is_active = '1'
      AND (${startDate} IS NULL OR bk.tanggal >= ${startDate})
      AND (${endExclusive} IS NULL OR bk.tanggal < ${endExclusive})
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR bk.transaksi_id LIKE ${like}
        OR bk.teknisi LIKE ${like}
      )
  `
  const totalValue = totalRows[0]?.total
  const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue ?? 0)
  const limit = exportCsv ? Math.min(10000, total || 10000) : pageSize
  const offset = exportCsv ? 0 : (page - 1) * pageSize

  const rows = await prisma.$queryRaw<
    Array<{
      id: number
      transaksi_id: string
      tanggal: Date
      kd_barang: string
      nama_barang: string
      nama_satuan: string | null
      jumlah: number | null
      teknisi: string
      keterangan: string
    }>
  >`
    SELECT bk.id, bk.transaksi_id, bk.tanggal, b.kd_barang, b.nama_barang, s.nama_satuan, bk.jumlah, bk.teknisi, bk.keterangan
    FROM tbl_barang_keluar bk
    LEFT JOIN tbl_barang b ON b.id_barang = bk.id_barang
    LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
    WHERE bk.is_active = '1'
      AND (${startDate} IS NULL OR bk.tanggal >= ${startDate})
      AND (${endExclusive} IS NULL OR bk.tanggal < ${endExclusive})
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR bk.transaksi_id LIKE ${like}
        OR bk.teknisi LIKE ${like}
      )
    ORDER BY bk.tanggal DESC, bk.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  if (exportCsv) {
    const csvRows = rows.map((r: { transaksi_id: string; tanggal: Date; kd_barang: string; nama_barang: string; nama_satuan: string | null; jumlah: number | null; teknisi: string; keterangan: string }) => ({
      transaksi_id: r.transaksi_id,
      tanggal: r.tanggal.toISOString().slice(0, 10),
      kd_barang: r.kd_barang,
      nama_barang: r.nama_barang,
      satuan: r.nama_satuan ?? '',
      teknisi: r.teknisi ?? '',
      jumlah_keluar: r.jumlah ?? 0,
      keterangan: r.keterangan ?? '',
    }))
    const csv = toCsv(csvRows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="transaksi-keluar.csv"',
      },
    })
  }

  return NextResponse.json({ total, page, pageSize, rows })
}

async function genTransId(prefix: string, tanggal: Date) {
  const y = tanggal.getFullYear()
  const m = String(tanggal.getMonth() + 1).padStart(2, '0')
  const d = String(tanggal.getDate()).padStart(2, '0')
  const dayStart = new Date(y, tanggal.getMonth(), tanggal.getDate())
  const dayEnd = new Date(y, tanggal.getMonth(), tanggal.getDate() + 1)
  const count = await prisma.tbl_barang_keluar.count({ where: { tanggal: { gte: dayStart, lt: dayEnd } } })
  const seq = String(count + 1).padStart(3, '0')
  return `${prefix}${y}${m}${d}-${seq}`
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const id_barang = Number(body?.id_barang ?? NaN)
  const jumlah = Number(body?.jumlah ?? NaN)
  const tanggal = body?.tanggal ? new Date(String(body.tanggal)) : new Date()
  const keterangan = String(body?.keterangan ?? '').trim()
  const teknisi = String(body?.teknisi ?? '').trim()
  const user_id = Number(body?.user_id ?? 0)

  if (!Number.isFinite(id_barang) || !Number.isFinite(jumlah) || jumlah <= 0) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  const transaksi_id = await genTransId('BRG-KLR-', tanggal)

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.tbl_barang_keluar.create({
      data: {
        transaksi_id,
        tanggal,
        id_barang,
        jumlah,
        user_id,
        keterangan,
        teknisi,
        is_active: 'ONE',
      },
    })
    await tx.tbl_barang.update({
      where: { id_barang },
      data: { stok: { decrement: jumlah } },
    })
  })

  return NextResponse.json({ ok: true, transaksi_id })
}
