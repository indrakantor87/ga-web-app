import { prisma } from '@/lib/prisma'

export type DashboardChartPoint = {
  name: string
  masuk: number
  keluar: number
}

export type DashboardLowStockItem = {
  kd_barang: string
  nama_barang: string
  stok: number
  stok_minimum: number
}

export type DashboardActivity = {
  time: string
  user: string
  action: string
  ref: string
  note: string
}

export type DashboardSparkPoint = { name: string; val: number }

export type DashboardData = {
  totalBarang: number
  totalJenis: number
  totalSatuan: number
  masukBulanIni: number
  keluarBulanIni: number
  deltaMasukPct: number
  deltaKeluarPct: number
  chart: DashboardChartPoint[]
  lowStock: DashboardLowStockItem[]
  activities: DashboardActivity[]
  spark: DashboardSparkPoint[]
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

function addDays(d: Date, days: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function monthLabel(monthIndex0: number) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return names[monthIndex0] ?? ''
}

function dayLabel(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const nextMonthStart = addMonths(monthStart, 1)
  const prevMonthStart = addMonths(monthStart, -1)

  const [totalBarang, totalJenis, totalSatuan] = await Promise.all([
    prisma.tbl_barang.count({ where: { is_active: 'ONE' } }),
    prisma.tbl_jenis.count({ where: { is_active: 'ONE' } }),
    prisma.tbl_satuan.count({ where: { is_active: 'ONE' } }),
  ])

  const [masukCurAgg, masukPrevAgg, keluarCurAgg, keluarPrevAgg] = await Promise.all([
    prisma.tbl_barang_masuk.aggregate({
      where: { is_active: 'ONE', tanggal: { gte: monthStart, lt: nextMonthStart } },
      _sum: { jumlah: true },
    }),
    prisma.tbl_barang_masuk.aggregate({
      where: { is_active: 'ONE', tanggal: { gte: prevMonthStart, lt: monthStart } },
      _sum: { jumlah: true },
    }),
    prisma.tbl_barang_keluar.aggregate({
      where: { is_active: 'ONE', tanggal: { gte: monthStart, lt: nextMonthStart } },
      _sum: { jumlah: true },
    }),
    prisma.tbl_barang_keluar.aggregate({
      where: { is_active: 'ONE', tanggal: { gte: prevMonthStart, lt: monthStart } },
      _sum: { jumlah: true },
    }),
  ])

  const masukBulanIni = masukCurAgg._sum.jumlah ?? 0
  const masukBulanLalu = masukPrevAgg._sum.jumlah ?? 0
  const keluarBulanIni = keluarCurAgg._sum.jumlah ?? 0
  const keluarBulanLalu = keluarPrevAgg._sum.jumlah ?? 0

  const deltaMasukPct = masukBulanLalu === 0 ? 0 : ((masukBulanIni - masukBulanLalu) / masukBulanLalu) * 100
  const deltaKeluarPct = keluarBulanLalu === 0 ? 0 : ((keluarBulanIni - keluarBulanLalu) / keluarBulanLalu) * 100

  const chart: DashboardChartPoint[] = []
  const monthRanges = Array.from({ length: 7 }).map((_, idx) => {
    const offset = 6 - idx
    const start = addMonths(monthStart, -offset)
    const end = addMonths(monthStart, -offset + 1)
    return { start, end, label: monthLabel(start.getMonth()) }
  })

  const [masukMonthly, keluarMonthly] = await Promise.all([
    prisma.$queryRaw<{ month: number; year: number; total: number }[]>`
      SELECT MONTH(tanggal) as month, YEAR(tanggal) as year, SUM(jumlah) as total
      FROM tbl_barang_masuk
      WHERE is_active = '1' AND tanggal >= ${addMonths(monthStart, -6)} AND tanggal < ${addMonths(monthStart, 1)}
      GROUP BY YEAR(tanggal), MONTH(tanggal)
    `,
    prisma.$queryRaw<{ month: number; year: number; total: number }[]>`
      SELECT MONTH(tanggal) as month, YEAR(tanggal) as year, SUM(jumlah) as total
      FROM tbl_barang_keluar
      WHERE is_active = '1' AND tanggal >= ${addMonths(monthStart, -6)} AND tanggal < ${addMonths(monthStart, 1)}
      GROUP BY YEAR(tanggal), MONTH(tanggal)
    `
  ])

  for (let i = 0; i < monthRanges.length; i++) {
    const r = monthRanges[i]
    if (!r) continue
    const m = r.start.getMonth() + 1
    const y = r.start.getFullYear()
    
    // Find matching data in results (converted to number/BigInt might be needed depending on driver)
    const inData = masukMonthly.find((x: { month: number; year: number; total: number }) => x.month === m && x.year === y)
    const outData = keluarMonthly.find((x: { month: number; year: number; total: number }) => x.month === m && x.year === y)

    chart.push({
      name: r.label,
      masuk: Number(inData?.total ?? 0),
      keluar: Number(outData?.total ?? 0),
    })
  }

  const lowStock = await prisma.$queryRaw<DashboardLowStockItem[]>`
    SELECT kd_barang, nama_barang, stok, stok_minimum
    FROM tbl_barang
    WHERE is_active = '1' AND stok <= stok_minimum
    ORDER BY (stok - stok_minimum) ASC, stok ASC
    LIMIT 6
  `

  const activitiesRows = await prisma.$queryRaw<
    Array<{
      kind: 'IN' | 'OUT'
      id: number
      tanggal: Date
      ref: string
      user: string | null
      item: string | null
      qty: number | null
      ket: string | null
    }>
  >`
    SELECT 'IN' AS kind, bm.id AS id, bm.tanggal AS tanggal, bm.transaksi_id AS ref, u.firstname AS user, b.nama_barang AS item, bm.jumlah AS qty, bm.keterangan AS ket
    FROM tbl_barang_masuk bm
    LEFT JOIN users u ON u.user_id = bm.user_id
    LEFT JOIN tbl_barang b ON b.id_barang = bm.id_barang
    WHERE bm.is_active = '1'
    UNION ALL
    SELECT 'OUT' AS kind, bk.id AS id, bk.tanggal AS tanggal, bk.transaksi_id AS ref, u.firstname AS user, b.nama_barang AS item, bk.jumlah AS qty, bk.keterangan AS ket
    FROM tbl_barang_keluar bk
    LEFT JOIN users u ON u.user_id = bk.user_id
    LEFT JOIN tbl_barang b ON b.id_barang = bk.id_barang
    WHERE bk.is_active = '1'
    ORDER BY tanggal DESC, id DESC
    LIMIT 10
  `

  const activities: DashboardActivity[] = activitiesRows.map((r: {
    kind: 'IN' | 'OUT'
    id: number
    tanggal: Date
    ref: string
    user: string | null
    item: string | null
    qty: number | null
    ket: string | null
  }) => {
    const parts = [r.item ?? undefined, r.ket ?? undefined].filter(Boolean) as string[]
    const qty = r.qty != null ? `x${r.qty}` : ''
    const note = parts.length === 0 ? '-' : qty ? `${parts.join(' · ')} ${qty}` : parts.join(' · ')
    return {
      time: r.tanggal.toISOString(),
      user: r.user ?? '-',
      action: r.kind === 'IN' ? 'Barang Masuk' : 'Barang Keluar',
      ref: r.ref,
      note,
    }
  })

  const spark: DashboardSparkPoint[] = []
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayStart = addDays(todayStart, -6)

  const dayRanges = Array.from({ length: 7 }).map((_, i) => {
    const start = addDays(dayStart, i)
    const end = addDays(dayStart, i + 1)
    return { start, end }
  })

  const [masukDaily, keluarDaily] = await Promise.all([
    prisma.$queryRaw<{ date: Date; total: number }[]>`
      SELECT DATE(tanggal) as date, SUM(jumlah) as total
      FROM tbl_barang_masuk
      WHERE is_active = '1' AND tanggal >= ${dayStart} AND tanggal < ${addDays(todayStart, 1)}
      GROUP BY DATE(tanggal)
    `,
    prisma.$queryRaw<{ date: Date; total: number }[]>`
      SELECT DATE(tanggal) as date, SUM(jumlah) as total
      FROM tbl_barang_keluar
      WHERE is_active = '1' AND tanggal >= ${dayStart} AND tanggal < ${addDays(todayStart, 1)}
      GROUP BY DATE(tanggal)
    `
  ])

  for (let i = 0; i < dayRanges.length; i++) {
    const d = dayRanges[i]?.start ?? todayStart
    // Match date string YYYY-MM-DD
    const dateStr = d.toISOString().split('T')[0]
    
    const masuk = masukDaily.find((x: { date: Date; total: number }) => x.date.toISOString().split('T')[0] === dateStr)?.total ?? 0
    const keluar = keluarDaily.find((x: { date: Date; total: number }) => x.date.toISOString().split('T')[0] === dateStr)?.total ?? 0
    
    spark.push({ name: dayLabel(d), val: Number(masuk) + Number(keluar) })
  }

  return {
    totalBarang,
    totalJenis,
    totalSatuan,
    masukBulanIni,
    keluarBulanIni,
    deltaMasukPct,
    deltaKeluarPct,
    chart,
    lowStock,
    activities,
    spark,
  }
}
