
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'developer@perkasa.net.id'
  const rawPassword = '123456'

  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('User NOT FOUND in database!')
    return
  }

  console.log('User found:', {
    email: user.email,
    passwordHash: user.password,
    status: user.status,
    level: user.level
  })

  const isValid = await bcrypt.compare(rawPassword, user.password)
  console.log(`Password check for '${rawPassword}':`, isValid ? 'VALID' : 'INVALID')
  
  if (!isValid) {
    // Generate new hash to compare
    const newHash = await bcrypt.hash(rawPassword, 10)
    console.log('Expected hash format example:', newHash)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
