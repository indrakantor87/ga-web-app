import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const filter = (url.searchParams.get('filter') ?? 'all').toLowerCase()
  const status = (url.searchParams.get('status') ?? 'all').toLowerCase()
  const exportCsv = url.searchParams.get('export') === 'csv'

  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const pageSize = Math.min(200, Math.max(5, toInt(url.searchParams.get('pageSize'), 10)))
  const like = q ? `%${q}%` : null

  const totalRows = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total
    FROM tbl_barang b
    WHERE 1=1
      AND (
        ${status} = 'all'
        OR (${status} = 'active' AND b.is_active = '1')
        OR (${status} = 'inactive' AND b.is_active = '0')
      )
      AND (
        ${filter} = 'all'
        OR (${filter} = 'low' AND b.stok <= b.stok_minimum)
        OR (${filter} = 'negative' AND b.stok < 0)
        OR (${filter} = 'zero' AND b.stok = 0)
      )
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR b.barcode LIKE ${like}
      )
  `
  const totalValue = totalRows[0]?.total
  const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue ?? 0)

  const limit = exportCsv ? Math.min(10000, total || 10000) : pageSize
  const offset = exportCsv ? 0 : (page - 1) * pageSize

  const rows = await prisma.$queryRaw<
    Array<{
      kd_barang: string
      barcode: string
      nama_barang: string
      nama_satuan: string | null
      nama_jenis: string | null
      stok_minimum: number
      stok: number
      is_active: string
    }>
  >`
    SELECT
      b.kd_barang,
      b.barcode,
      b.nama_barang,
      s.nama_satuan,
      j.nama_jenis,
      b.stok_minimum,
      b.stok,
      b.is_active
    FROM tbl_barang b
    LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
    LEFT JOIN tbl_jenis j ON j.id_jenis = b.id_jenis
    WHERE 1=1
      AND (
        ${status} = 'all'
        OR (${status} = 'active' AND b.is_active = '1')
        OR (${status} = 'inactive' AND b.is_active = '0')
      )
      AND (
        ${filter} = 'all'
        OR (${filter} = 'low' AND b.stok <= b.stok_minimum)
        OR (${filter} = 'negative' AND b.stok < 0)
        OR (${filter} = 'zero' AND b.stok = 0)
      )
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR b.barcode LIKE ${like}
      )
    ORDER BY b.kd_barang ASC
    LIMIT ${limit} OFFSET ${offset}
  `

  if (exportCsv) {
    const csvRows = rows.map((r) => ({
      kd_barang: r.kd_barang,
      barcode: r.barcode,
      nama_barang: r.nama_barang,
      satuan: r.nama_satuan ?? '',
      jenis: r.nama_jenis ?? '',
      stok_minimum: r.stok_minimum,
      stok: r.stok,
      status: r.is_active === '1' ? 'Aktif' : 'Nonaktif',
    }))
    const csv = toCsv(csvRows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="laporan-stok.csv"',
      },
    })
  }

  return NextResponse.json({ total, page, pageSize, rows })
}
