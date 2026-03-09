import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

  const where: Prisma.tbl_jenisWhereInput = {}
  if (q) where.nama_jenis = { contains: q }
  if (status === 'active') where.is_active = 'ONE'
  if (status === 'inactive') where.is_active = 'ZERO'

  const [total, rows] = await Promise.all([
    prisma.tbl_jenis.count({ where }),
    prisma.tbl_jenis.findMany({
      where,
      orderBy: [{ id_jenis: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id_jenis: true,
        nama_jenis: true,
        is_active: true
      },
    }),
  ])

  return NextResponse.json({ total, page, pageSize, rows })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const nama_jenis = String(body?.nama_jenis ?? '').trim()
  const is_active = String(body?.is_active ?? 'ONE')

  if (!nama_jenis) return NextResponse.json({ error: 'Nama jenis wajib diisi' }, { status: 400 })

  const created = await prisma.tbl_jenis.create({
    data: {
      nama_jenis,
      is_active: is_active === 'ZERO' ? 'ZERO' : 'ONE',
    },
    select: { id_jenis: true },
  })

  return NextResponse.json(created, { status: 201 })
}
