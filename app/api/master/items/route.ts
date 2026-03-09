import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toInt(v: string | null, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const status = (url.searchParams.get('status') ?? 'all').toLowerCase()
  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const pageSize = Math.min(100, Math.max(5, toInt(url.searchParams.get('pageSize'), 10)))

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
      AND (${like} IS NULL OR b.nama_barang LIKE ${like} OR b.kd_barang LIKE ${like} OR b.barcode LIKE ${like})
  `

  const totalValue = totalRows[0]?.total
  const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue ?? 0)
  const offset = (page - 1) * pageSize

  const rows = await prisma.$queryRaw<
    Array<{
      id_barang: number
      kd_barang: string
      barcode: string
      nama_barang: string
      harga: string
      stok_minimum: number
      stok: number
      foto: string | null
      is_active: string
      nama_jenis: string | null
      nama_satuan: string | null
      id_jenis: number
      id_satuan: number
    }>
  >`
    SELECT
      b.id_barang,
      b.kd_barang,
      b.barcode,
      b.nama_barang,
      b.harga,
      b.stok_minimum,
      b.stok,
      b.foto,
      b.is_active,
      j.nama_jenis,
      s.nama_satuan,
      b.id_jenis,
      b.id_satuan
    FROM tbl_barang b
    LEFT JOIN tbl_jenis j ON j.id_jenis = b.id_jenis
    LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
    WHERE 1=1
      AND (
        ${status} = 'all'
        OR (${status} = 'active' AND b.is_active = '1')
        OR (${status} = 'inactive' AND b.is_active = '0')
      )
      AND (${like} IS NULL OR b.nama_barang LIKE ${like} OR b.kd_barang LIKE ${like} OR b.barcode LIKE ${like})
    ORDER BY b.id_barang DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  return NextResponse.json({ total, page, pageSize, rows })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  const kd_barang = String(body?.kd_barang ?? '').trim()
  const barcode = String(body?.barcode ?? '').trim()
  const nama_barang = String(body?.nama_barang ?? '').trim()
  const harga = Number(body?.harga ?? 0)
  const id_jenis = Number(body?.id_jenis ?? NaN)
  const id_satuan = Number(body?.id_satuan ?? NaN)
  const stok_minimum = Number(body?.stok_minimum ?? 0)
  const foto = body?.foto != null && String(body.foto).trim() ? String(body.foto).trim() : null
  const is_active = String(body?.is_active ?? 'ONE')

  if (!kd_barang || !nama_barang) return NextResponse.json({ error: 'Kode barang dan nama barang wajib diisi' }, { status: 400 })
  if (!Number.isFinite(harga) || harga < 0) return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 })
  if (!Number.isFinite(id_jenis) || !Number.isFinite(id_satuan)) return NextResponse.json({ error: 'Jenis dan satuan wajib dipilih' }, { status: 400 })
  if (!Number.isFinite(stok_minimum) || stok_minimum < 0) return NextResponse.json({ error: 'Stok minimum tidak valid' }, { status: 400 })

  const created = await prisma.tbl_barang.create({
    data: {
      kd_barang,
      barcode,
      nama_barang,
      harga,
      id_jenis,
      id_satuan,
      stok_minimum,
      stok: 0,
      foto,
      is_active: is_active === 'ZERO' ? 'ZERO' : 'ONE',
    },
    select: { id_barang: true },
  })

  return NextResponse.json(created, { status: 201 })
}
