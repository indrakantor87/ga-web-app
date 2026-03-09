import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'developer@perkasa.net.id'
  const password = await bcrypt.hash('123456', 10)

  console.log('Seeding default user...')

  const user = await prisma.users.upsert({
    where: { email },
    update: {
      password, // Reset password to 123456
      level: 'admin',
      status: 'aktif',
    },
    create: {
      email,
      firstname: 'Developer',
      nohape: '-',
      password,
      level: 'admin',
      status: 'aktif',
    },
  })

  console.log('Default user seeded:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
