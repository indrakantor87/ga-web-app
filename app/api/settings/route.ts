import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

function sanitizeText(v: unknown) {
  return String(v ?? '').trim()
}

function safeExtFromName(name: string) {
  const ext = path.extname(name).toLowerCase()
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') return ext
  return ''
}

async function getOrCreateSettings() {
  const existing = await prisma.settings.findFirst({ orderBy: { id: 'asc' } })
  if (existing) return existing
  return prisma.settings.create({
    data: {
      nama_aplikasi: 'Persediaan Barang Perkasa Networks',
      alamat: '',
      keterangan: '',
      logo: null,
      level: 'admin',
    },
  })
}

export async function GET() {
  const settings = await getOrCreateSettings()
  const rawLogo = settings.logo ?? ''
  const logo =
    rawLogo && !rawLogo.startsWith('/') && !rawLogo.startsWith('http')
      ? `/uploads/settings/${rawLogo}`
      : rawLogo
  return NextResponse.json({
    id: settings.id,
    nama_aplikasi: settings.nama_aplikasi,
    alamat: settings.alamat,
    keterangan: settings.keterangan ?? '',
    logo,
  })
}

export async function POST(req: Request) {
  const settings = await getOrCreateSettings()
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData()
    const nama_aplikasi = sanitizeText(fd.get('nama_aplikasi'))
    const alamat = sanitizeText(fd.get('alamat'))
    const keterangan = sanitizeText(fd.get('keterangan'))
    const logoFile = fd.get('logo')

    let logoPath: string | null | undefined = undefined
    if (logoFile instanceof File && logoFile.size > 0) {
      const ext = safeExtFromName(logoFile.name)
      if (!ext) return NextResponse.json({ error: 'Format logo harus PNG/JPG/JPEG/WEBP' }, { status: 400 })
      const bytes = Buffer.from(await logoFile.arrayBuffer())
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'settings')
      await mkdir(uploadDir, { recursive: true })
      const filename = `${randomUUID()}${ext}`
      const full = path.join(uploadDir, filename)
      await writeFile(full, bytes)
      logoPath = `/uploads/settings/${filename}`
    }

    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        nama_aplikasi: nama_aplikasi || settings.nama_aplikasi,
        alamat,
        keterangan,
        ...(logoPath !== undefined ? { logo: logoPath } : {}),
      },
    })

    return NextResponse.json({ ok: true })
  }

  const body = await req.json().catch(() => ({}))
  const nama_aplikasi = sanitizeText(body?.nama_aplikasi)
  const alamat = sanitizeText(body?.alamat)
  const keterangan = sanitizeText(body?.keterangan)
  const logo = sanitizeText(body?.logo)

  await prisma.settings.update({
    where: { id: settings.id },
    data: {
      nama_aplikasi: nama_aplikasi || settings.nama_aplikasi,
      alamat,
      keterangan,
      logo: logo || null,
    },
  })

  return NextResponse.json({ ok: true })
}
