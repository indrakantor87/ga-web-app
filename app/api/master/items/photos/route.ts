import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import type { Dirent } from 'fs'
import path from 'path'

export async function GET() {
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads')
  const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
  const files: { name: string; url: string }[] = []

  try {
    const entries = (await readdir(uploadRoot, { withFileTypes: true })) as unknown as Dirent[]
    for (const e of entries) {
      if (e.isDirectory()) {
        const sub = e.name
        try {
          const subEntries = (await readdir(path.join(uploadRoot, sub), { withFileTypes: true })) as unknown as Dirent[]
          for (const se of subEntries) {
            if (se.isDirectory()) continue
            const ext = path.extname(se.name).toLowerCase()
            if (!allowedExt.has(ext)) continue
            const rel = path.join(sub, se.name).replaceAll('\\', '/')
            files.push({ name: se.name, url: `/uploads/${rel}` })
          }
        } catch {}
        continue
      }
      const ext = path.extname(e.name).toLowerCase()
      if (!allowedExt.has(ext)) continue
      files.push({ name: e.name, url: `/uploads/${e.name}` })
    }
  } catch {
    return NextResponse.json({ files: [] })
  }

  files.sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ files })
}
