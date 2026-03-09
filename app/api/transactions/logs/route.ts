import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toInt(v: string | null, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const pageSize = Math.min(100, Math.max(5, toInt(url.searchParams.get('pageSize'), 20)))

  const startDate = start ? new Date(start) : null
  const endExclusive = end ? new Date(new Date(end).setDate(new Date(end).getDate() + 1)) : null
  const like = q ? `%${q}%` : null

  const totalRows = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT
      (SELECT COUNT(*)
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
      )
      +
      (SELECT COUNT(*)
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
      )
      AS total
  `
  const totalValue = totalRows[0]?.total
  const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue ?? 0)

  const offset = (page - 1) * pageSize

  const rows = await prisma.$queryRaw<
    Array<{ kind: 'IN' | 'OUT'; tanggal: Date; transaksi_id: string; kd_barang: string; nama_barang: string; jumlah: number | null; teknisi: string | null; keterangan: string | null }>
  >`
    SELECT 'IN' AS kind, bm.tanggal, bm.transaksi_id, b.kd_barang, b.nama_barang, bm.jumlah, NULL AS teknisi, bm.keterangan
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
    UNION ALL
    SELECT 'OUT' AS kind, bk.tanggal, bk.transaksi_id, b.kd_barang, b.nama_barang, bk.jumlah, bk.teknisi, bk.keterangan
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
    ORDER BY tanggal DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  return NextResponse.json({ total, page, pageSize, rows })
}
