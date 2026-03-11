import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdir } from 'fs/promises'
import type { Dirent } from 'fs'
import path from 'path'

type FileEntry = { rel: string; base: string; normalized: string }

function normalizeToken(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function listUploadImages(): Promise<FileEntry[]> {
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads')
  const out: FileEntry[] = []

  const pushFile = (rel: string) => {
    const base = path.basename(rel)
    const normalized = normalizeToken(base)
    out.push({ rel, base, normalized })
  }

  let entries: Dirent[] = []
  try {
    entries = (await readdir(uploadRoot, { withFileTypes: true })) as unknown as Dirent[]
  } catch {
    return []
  }

  const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

  for (const e of entries) {
    if (e.isDirectory()) {
      const sub = e.name
      try {
        const subEntries = (await readdir(path.join(uploadRoot, sub), { withFileTypes: true })) as unknown as Dirent[]
        for (const se of subEntries) {
          if (se.isDirectory()) continue
          const ext = path.extname(se.name).toLowerCase()
          if (!allowedExt.has(ext)) continue
          pushFile(path.join(sub, se.name).replaceAll('\\', '/'))
        }
      } catch {}
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    if (!allowedExt.has(ext)) continue
    pushFile(e.name)
  }

  return out
}

export async function POST() {
  const files = await listUploadImages()
  if (files.length === 0) return NextResponse.json({ ok: true, linked: 0, missing: 0, scanned: 0 })

  const items = await prisma.tbl_barang.findMany({
    select: { id_barang: true, kd_barang: true, barcode: true, foto: true },
  })

  const fileByBarcode = new Map<string, string>()
  const fileByKode = new Map<string, string>()

  for (const f of files) {
    const baseLower = f.base.toLowerCase()

    const barcodeMatches = f.base.match(/\d{8,20}/g) || []
    for (const m of barcodeMatches) {
      if (m.length === 13 && !fileByBarcode.has(m)) {
        fileByBarcode.set(m, f.rel)
      }
    }

    const kdMatch = baseLower.match(/p\d{3,10}/g) || []
    for (const m of kdMatch) {
      const normalized = normalizeToken(m)
      if (normalized && !fileByKode.has(normalized)) {
        fileByKode.set(normalized, f.rel)
      }
    }
  }

  let linked = 0
  let missing = 0

  await prisma.$transaction(async (tx) => {
    for (const it of items) {
      const current = (it.foto ?? '').trim()
      if (current) continue

      const barcode = String(it.barcode ?? '').trim()
      const kd = normalizeToken(it.kd_barang)
      const match = (barcode && fileByBarcode.get(barcode)) || (kd && fileByKode.get(kd)) || null
      if (!match) {
        missing++
        continue
      }

      const foto = match.startsWith('/uploads/') ? match.slice('/uploads/'.length) : match
      await tx.tbl_barang.update({
        where: { id_barang: it.id_barang },
        data: { foto },
      })
      linked++
    }
  })

  return NextResponse.json({ ok: true, linked, missing, scanned: files.length })
}
