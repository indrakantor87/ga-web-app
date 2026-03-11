import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ImportItem = {
  kd_barang: string
  barcode: string
  nama_barang: string
  harga: number
  id_jenis: number
  id_satuan: number
  stok_minimum: number
  foto?: string | null
  is_active?: 'ONE' | 'ZERO'
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const items = Array.isArray(body?.items) ? (body.items as ImportItem[]) : []
  if (items.length === 0) return NextResponse.json({ error: 'Tidak ada data untuk diimport' }, { status: 400 })

  for (const it of items) {
    const kd_barang = String(it?.kd_barang ?? '').trim()
    const nama_barang = String(it?.nama_barang ?? '').trim()
    const barcode = String(it?.barcode ?? '').trim()
    const harga = Number(it?.harga ?? NaN)
    const id_jenis = Number(it?.id_jenis ?? NaN)
    const id_satuan = Number(it?.id_satuan ?? NaN)
    const stok_minimum = Number(it?.stok_minimum ?? NaN)

    if (!kd_barang || !nama_barang) return NextResponse.json({ error: 'Kode barang dan nama barang wajib diisi' }, { status: 400 })
    if (!Number.isFinite(harga) || harga < 0) return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 })
    if (!Number.isFinite(id_jenis) || !Number.isFinite(id_satuan)) return NextResponse.json({ error: 'Jenis dan satuan wajib dipilih' }, { status: 400 })
    if (!Number.isFinite(stok_minimum) || stok_minimum < 0) return NextResponse.json({ error: 'Stok minimum tidak valid' }, { status: 400 })
    if (!barcode) return NextResponse.json({ error: 'Barcode wajib diisi' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    let created = 0
    let updated = 0

    for (const it of items) {
      const kd_barang = String(it.kd_barang).trim()
      const barcode = String(it.barcode).trim()
      const nama_barang = String(it.nama_barang).trim()
      const harga = Number(it.harga)
      const id_jenis = Number(it.id_jenis)
      const id_satuan = Number(it.id_satuan)
      const stok_minimum = Number(it.stok_minimum)
      const foto = it.foto != null && String(it.foto).trim() ? String(it.foto).trim() : null
      const is_active = it.is_active === 'ZERO' ? 'ZERO' : 'ONE'

      const existing = await tx.tbl_barang.findFirst({
        where: { kd_barang }
      })

      if (existing) {
        await tx.tbl_barang.update({
          where: { id_barang: existing.id_barang },
          data: {
            kd_barang,
            barcode,
            nama_barang,
            harga,
            id_jenis,
            id_satuan,
            stok_minimum,
            foto,
            is_active,
          },
          select: { id_barang: true },
        })
        updated++
      } else {
        await tx.tbl_barang.create({
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
            is_active,
          },
          select: { id_barang: true },
        })
        created++
      }
    }

    return { created, updated }
  })

  return NextResponse.json({ ok: true, ...result })
}

