import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'favicon.png')
  const buf = await readFile(filePath)

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

