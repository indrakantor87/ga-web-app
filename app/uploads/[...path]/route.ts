import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

function contentTypeFor(ext: string) {
  const e = ext.toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg'
  if (e === '.webp') return 'image/webp'
  if (e === '.gif') return 'image/gif'
  if (e === '.svg') return 'image/svg+xml'
  if (e === '.ico') return 'image/x-icon'
  return 'application/octet-stream'
}

function candidateUploadRoots() {
  const roots: string[] = []
  roots.push(path.join(process.cwd(), 'public', 'uploads'))
  const envDir = process.env.UPLOAD_DIR ? String(process.env.UPLOAD_DIR) : ''
  if (envDir) roots.push(envDir)
  roots.push(process.platform === 'win32' ? path.join(process.cwd(), 'tmp', 'uploads') : '/tmp/ga-web-app-uploads')
  return Array.from(new Set(roots))
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params
  const rel = parts.join('/').replaceAll('\\', '/')
  if (!rel || rel.includes('..')) return new NextResponse('Bad Request', { status: 400 })

  for (const root of candidateUploadRoots()) {
    const full = path.join(root, rel)
    try {
      const buf = await readFile(full)
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': contentTypeFor(path.extname(rel)),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {}
  }

  return new NextResponse('Not Found', { status: 404 })
}

