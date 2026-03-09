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
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const exportCsv = url.searchParams.get('export') === 'csv'

  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const pageSize = Math.min(200, Math.max(5, toInt(url.searchParams.get('pageSize'), 10)))

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
        OR bk.keterangan LIKE ${like}
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
      nama_jenis: string | null
      jumlah: number | null
      teknisi: string
      keterangan: string
    }>
  >`
    SELECT
      bk.id,
      bk.transaksi_id,
      bk.tanggal,
      b.kd_barang,
      b.nama_barang,
      s.nama_satuan,
      j.nama_jenis,
      bk.jumlah,
      bk.teknisi,
      bk.keterangan
    FROM tbl_barang_keluar bk
    LEFT JOIN tbl_barang b ON b.id_barang = bk.id_barang
    LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
    LEFT JOIN tbl_jenis j ON j.id_jenis = b.id_jenis
    WHERE bk.is_active = '1'
      AND (${startDate} IS NULL OR bk.tanggal >= ${startDate})
      AND (${endExclusive} IS NULL OR bk.tanggal < ${endExclusive})
      AND (
        ${like} IS NULL
        OR b.nama_barang LIKE ${like}
        OR b.kd_barang LIKE ${like}
        OR bk.transaksi_id LIKE ${like}
        OR bk.keterangan LIKE ${like}
        OR bk.teknisi LIKE ${like}
      )
    ORDER BY bk.tanggal DESC, bk.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  if (exportCsv) {
    const csvRows = rows.map((r) => ({
      transaksi_id: r.transaksi_id,
      tanggal: r.tanggal.toISOString().slice(0, 10),
      kd_barang: r.kd_barang,
      nama_barang: r.nama_barang,
      satuan: r.nama_satuan ?? '',
      jenis: r.nama_jenis ?? '',
      teknisi: r.teknisi ?? '',
      jumlah_keluar: r.jumlah ?? 0,
      keterangan: r.keterangan ?? '',
    }))
    const csv = toCsv(csvRows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="laporan-barang-keluar.csv"',
      },
    })
  }

  return NextResponse.json({ total, page, pageSize, rows })
}
