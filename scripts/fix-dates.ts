
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL || "mysql://root:@127.0.0.1:3306/jagodigital"
    }
  }
})

async function main() {
  console.log('--- FIXING INVALID DATES (0000-00-00) ---')

  // tbl_jenis
  console.log('Fixing tbl_jenis...')
  await prisma.$executeRaw`UPDATE tbl_jenis SET created_at = NULL WHERE CAST(created_at AS CHAR) LIKE '0000%'`
  await prisma.$executeRaw`UPDATE tbl_jenis SET updated_at = NULL WHERE CAST(updated_at AS CHAR) LIKE '0000%'`

  // tbl_satuan
  console.log('Fixing tbl_satuan...')
  await prisma.$executeRaw`UPDATE tbl_satuan SET created_at = NULL WHERE CAST(created_at AS CHAR) LIKE '0000%'`
  await prisma.$executeRaw`UPDATE tbl_satuan SET updated_at = NULL WHERE CAST(updated_at AS CHAR) LIKE '0000%'`

  // tbl_barang
  console.log('Fixing tbl_barang...')
  await prisma.$executeRaw`UPDATE tbl_barang SET created_at = NULL WHERE CAST(created_at AS CHAR) LIKE '0000%'`
  await prisma.$executeRaw`UPDATE tbl_barang SET updated_at = NULL WHERE CAST(updated_at AS CHAR) LIKE '0000%'`

  // users
  console.log('Fixing users...')
  await prisma.$executeRaw`UPDATE users SET created_at = NULL WHERE CAST(created_at AS CHAR) LIKE '0000%'`
  await prisma.$executeRaw`UPDATE users SET updated_at = NULL WHERE CAST(updated_at AS CHAR) LIKE '0000%'`

  // settings
  console.log('Fixing settings...')
  await prisma.$executeRaw`UPDATE settings SET created_at = NULL WHERE CAST(created_at AS CHAR) LIKE '0000%'`
  await prisma.$executeRaw`UPDATE settings SET updated_at = NULL WHERE CAST(updated_at AS CHAR) LIKE '0000%'`
  
  console.log('--- FIX COMPLETED ---')
}

main()
  .catch(e => {
    console.error('Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
