import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const contentType = file.type ? String(file.type) : ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Format file harus gambar' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const original = String(file.name || 'upload')
    const ext = path.extname(original).toLowerCase()
    const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
    if (!allowedExt.has(ext)) {
      return NextResponse.json({ success: false, error: 'Format gambar harus PNG/JPG/JPEG/WEBP/GIF' }, { status: 400 })
    }
    const rawBase = path.basename(original, ext)
    const baseSafe = rawBase.replace(/[^a-zA-Z0-9.-]/g, '-').slice(0, 40) || 'image'
    let finalName = `${uniqueSuffix}-${baseSafe}${ext}`
    if (finalName.length > 95) {
      const maxBase = Math.max(5, 95 - uniqueSuffix.length - 1 - ext.length)
      finalName = `${uniqueSuffix}-${baseSafe.slice(0, maxBase)}${ext}`
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const fullPath = path.join(uploadDir, finalName)
    await writeFile(fullPath, buffer)

    return NextResponse.json({ success: true, url: `/uploads/${finalName}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
