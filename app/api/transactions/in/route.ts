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
  try {
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
    FROM tbl_barang_masuk bm
    LEFT JOIN tbl_barang b ON b.id_barang = bm.id_barang
    WHERE bm.is_active = '1'
      AND (${startDate} IS NULL OR bm.tanggal >= ${startDate})
      AND (${endExclusive} IS NULL OR bm.tanggal < ${endExclusive})
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR bm.transaksi_id LIKE ${like}
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
      keterangan: string
      nama_toko: string | null
    }>
  >`
    SELECT bm.id, bm.transaksi_id, bm.tanggal, b.kd_barang, b.nama_barang, s.nama_satuan, bm.jumlah, bm.keterangan, bm.nama_toko
    FROM tbl_barang_masuk bm
    LEFT JOIN tbl_barang b ON b.id_barang = bm.id_barang
    LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
    WHERE bm.is_active = '1'
      AND (${startDate} IS NULL OR bm.tanggal >= ${startDate})
      AND (${endExclusive} IS NULL OR bm.tanggal < ${endExclusive})
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR bm.transaksi_id LIKE ${like}
      )
    ORDER BY bm.tanggal DESC, bm.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  if (exportCsv) {
    const csvRows = rows.map((r: { 
      transaksi_id: string
      tanggal: Date
      kd_barang: string
      nama_barang: string
      nama_satuan: string | null
      jumlah: number | null
      keterangan: string
      nama_toko: string | null
    }) => ({
      transaksi_id: r.transaksi_id,
      tanggal: r.tanggal.toISOString().slice(0, 10),
      kd_barang: r.kd_barang,
      nama_barang: r.nama_barang,
      satuan: r.nama_satuan ?? '',
      jumlah_masuk: r.jumlah ?? 0,
      keterangan: r.keterangan ?? '',
      nama_toko: r.nama_toko ?? '',
    }))
    const csv = toCsv(csvRows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="transaksi-masuk.csv"',
      },
    })
  }

    return NextResponse.json({ total, page, pageSize, rows })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

async function genTransId(prefix: string, tanggal: Date) {
  const y = tanggal.getFullYear()
  const m = String(tanggal.getMonth() + 1).padStart(2, '0')
  const d = String(tanggal.getDate()).padStart(2, '0')
  const dayStart = new Date(y, tanggal.getMonth(), tanggal.getDate())
  const dayEnd = new Date(y, tanggal.getMonth(), tanggal.getDate() + 1)
  const count = await prisma.tbl_barang_masuk.count({ where: { tanggal: { gte: dayStart, lt: dayEnd } } })
  const seq = String(count + 1).padStart(3, '0')
  return `${prefix}${y}${m}${d}-${seq}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tanggal, id_barang, jumlah, keterangan, nama_toko } = body

    if (!tanggal || !id_barang || !jumlah) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const dateObj = new Date(tanggal)
    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}${mm}${dd}`

    // Generate ID: BRG-MSK-YYYYMMDD-XXX
    const prefix = `BRG-MSK-${dateStr}-`
    const lastTx = await prisma.tbl_barang_masuk.findFirst({
      where: { transaksi_id: { startsWith: prefix } },
      orderBy: { transaksi_id: 'desc' },
    })

    let nextSeq = 1
    if (lastTx) {
      const parts = lastTx.transaksi_id.split('-')
      const lastSeq = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
    }

    const transaksi_id = `${prefix}${String(nextSeq).padStart(3, '0')}`

    // TODO: Get real user ID from session
    const user_id = 8 // Default user ID for now

    // Transaction
    const [newItem] = await prisma.$transaction([
      prisma.tbl_barang_masuk.create({
        data: {
          transaksi_id,
          tanggal: dateObj,
          id_barang: Number(id_barang),
          jumlah: Number(jumlah),
          keterangan: keterangan || '',
          nama_toko: nama_toko || '',
          user_id,
          is_active: '1',
        },
      }),
      prisma.tbl_barang.update({
        where: { id_barang: Number(id_barang) },
        data: { stok: { increment: Number(jumlah) } },
      }),
    ])

    return NextResponse.json({ ok: true, data: newItem })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
