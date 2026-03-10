import { prisma } from '@/lib/prisma'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.users.findMany({
    select: {
      user_id: true,
      firstname: true,
      email: true,
      level: true,
      status: true,
      nohape: true,
    },
    orderBy: { user_id: 'desc' },
  })

  const initialUsers = users.map((u) => ({
    user_id: u.user_id,
    firstname: u.firstname,
    email: u.email,
    level: u.level as 'admin' | 'operator',
    status: u.status as 'aktif' | 'nonaktif',
    nohape: u.nohape,
  }))

  return <UsersClient initialUsers={initialUsers} />
}
