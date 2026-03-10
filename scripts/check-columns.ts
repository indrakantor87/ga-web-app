import { prisma } from '../lib/prisma'

async function main() {
  console.log('Checking columns in tbl_barang_masuk...')
  try {
    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM tbl_barang_masuk`
    console.log(columns)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()