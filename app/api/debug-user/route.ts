import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.users.findUnique({
      where: { email: 'developer@perkasa.net.id' },
      select: {
        user_id: true,
        email: true,
        level: true,
        status: true,
        password: true, // Hashed
        updated_at: true
      }
    })

    if (!user) {
      return NextResponse.json({ status: 'User NOT FOUND' })
    }

    return NextResponse.json({ 
      status: 'User FOUND',
      data: user,
      env: process.env.NODE_ENV,
      db_url_preview: process.env.DATABASE_URL ? 'Set' : 'Unset'
    })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', error: error.message })
  }
}
