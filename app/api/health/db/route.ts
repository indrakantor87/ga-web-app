import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  return String(e)
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(e) }, { status: 500 })
  }
}
