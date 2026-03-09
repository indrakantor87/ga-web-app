
import { PrismaClient } from '@prisma/client'

// DB Lokal
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL || "mysql://root:@127.0.0.1:3306/jagodigital"
    }
  }
})

// DB Server (Coolify)
const remotePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REMOTE
    }
  }
})

async function main() {
  if (!process.env.DATABASE_URL_REMOTE) {
    console.error('Error: DATABASE_URL_REMOTE env var is missing')
    process.exit(1)
  }

  console.log('--- STARTING DB TRANSFER ---')
  console.log('1. Reading LOCAL data...')
  
  const [users, settings, units, categories, items, transactionsIn, transactionsOut] = await Promise.all([
    localPrisma.users.findMany(),
    localPrisma.settings.findMany(),
    localPrisma.tbl_satuan.findMany(),
    localPrisma.tbl_jenis.findMany(),
    localPrisma.tbl_barang.findMany(),
    localPrisma.tbl_barang_masuk.findMany(),
    localPrisma.tbl_barang_keluar.findMany(),
  ])

  console.log(`   Found:
   - Users: ${users.length}
   - Settings: ${settings.length}
   - Satuan: ${units.length}
   - Jenis: ${categories.length}
   - Barang: ${items.length}
   - Masuk: ${transactionsIn.length}
   - Keluar: ${transactionsOut.length}
  `)

  console.log('2. Writing to REMOTE server...')
  
  // Clean remote data first (reverse order of dependencies)
  console.log('   Cleaning remote tables...')
  await remotePrisma.tbl_barang_masuk.deleteMany()
  await remotePrisma.tbl_barang_keluar.deleteMany()
  await remotePrisma.tbl_barang.deleteMany()
  await remotePrisma.tbl_jenis.deleteMany()
  await remotePrisma.tbl_satuan.deleteMany()
  await remotePrisma.settings.deleteMany()
  await remotePrisma.users.deleteMany()

  // Insert data (order matters!)
  console.log('   Inserting Users...')
  if (users.length) await remotePrisma.users.createMany({ data: users })
  
  console.log('   Inserting Settings...')
  if (settings.length) await remotePrisma.settings.createMany({ data: settings })
  
  console.log('   Inserting Satuan...')
  if (units.length) await remotePrisma.tbl_satuan.createMany({ data: units })
  
  console.log('   Inserting Jenis...')
  if (categories.length) await remotePrisma.tbl_jenis.createMany({ data: categories })
  
  console.log('   Inserting Barang...')
  if (items.length) await remotePrisma.tbl_barang.createMany({ data: items })
  
  console.log('   Inserting Barang Masuk...')
  if (transactionsIn.length) await remotePrisma.tbl_barang_masuk.createMany({ data: transactionsIn })
  
  console.log('   Inserting Barang Keluar...')
  if (transactionsOut.length) await remotePrisma.tbl_barang_keluar.createMany({ data: transactionsOut })

  console.log('--- TRANSFER COMPLETED SUCCESSFULLY ---')
}

main()
  .catch(e => {
    console.error('Transfer failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await localPrisma.$disconnect()
    await remotePrisma.$disconnect()
  })
