import { prisma } from '../lib/prisma'

async function main() {
  console.log('Testing raw query for transactions/in...')
  try {
    const rows = await prisma.$queryRaw`
      SELECT bm.id, bm.transaksi_id, bm.tanggal, b.kd_barang, b.nama_barang, s.nama_satuan, bm.jumlah, bm.keterangan, bm.nama_toko
      FROM tbl_barang_masuk bm
      LEFT JOIN tbl_barang b ON b.id_barang = bm.id_barang
      LEFT JOIN tbl_satuan s ON s.id_satuan = b.id_satuan
      WHERE bm.is_active = '1'
      ORDER BY bm.tanggal DESC, bm.id DESC
      LIMIT 1
    `
    console.log('Query successful! Result:', rows)
  } catch (e) {
    console.error('Query failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()