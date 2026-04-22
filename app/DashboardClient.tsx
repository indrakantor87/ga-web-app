'use client'

import React, { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Boxes, Package, Ruler, TrendingDown, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardActivity, DashboardChartPoint, DashboardData, DashboardLowStockItem, DashboardSparkPoint } from '@/lib/dashboard'

function formatPct(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n))
}

function formatDateTimeId(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StockBadge({ stock, min }: { stock: number; min: number }) {
  const pct = clampPct((stock / Math.max(1, min)) * 100)
  const tone =
    pct < 50
      ? 'bg-red-50 text-red-700 border-red-200'
      : pct < 80
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  const label = pct < 50 ? 'Kritis' : pct < 80 ? 'Menipis' : 'Aman'
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>
}

function LowStockList({ items }: { items: DashboardLowStockItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">Tidak ada stok kritis.</div>
  }

  return (
    <div className="mt-4 space-y-4">
      {items.map((it) => {
        const pct = clampPct((it.stok / Math.max(1, it.stok_minimum)) * 100)
        const bar = pct < 50 ? 'bg-red-500' : pct < 80 ? 'bg-amber-500' : 'bg-emerald-500'
        return (
          <div key={it.kd_barang} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{it.nama_barang}</p>
                <p className="text-xs text-gray-500">{it.kd_barang}</p>
              </div>
              <StockBadge stock={it.stok} min={it.stok_minimum} />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Stok: {it.stok}</span>
                <span>Min: {it.stok_minimum}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div className={`h-2 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityTable({ rows }: { rows: DashboardActivity[] }) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">Belum ada aktivitas.</div>
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
            <th className="py-3 pr-4">Waktu</th>
            <th className="py-3 pr-4">User</th>
            <th className="py-3 pr-4">Aksi</th>
            <th className="py-3 pr-4">Referensi</th>
            <th className="py-3">Catatan</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {rows.map((row) => (
            <tr key={`${row.time}-${row.ref}`} className="border-b border-gray-50 last:border-0">
              <td className="py-3 pr-4 whitespace-nowrap text-gray-500">{formatDateTimeId(row.time)}</td>
              <td className="py-3 pr-4 font-medium text-gray-900">{row.user}</td>
              <td className="py-3 pr-4">
                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                  {row.action}
                </span>
              </td>
              <td className="py-3 pr-4 font-mono text-xs text-gray-600">{row.ref}</td>
              <td className="py-3">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Spark({ data, gradientId }: { data: DashboardSparkPoint[]; gradientId: string }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) return <div className="h-14 w-full rounded-lg bg-gray-50" />

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="val" stroke="#6366F1" strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TxChart({ data }: { data: DashboardChartPoint[] }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) return <div className="h-full w-full rounded-xl bg-gray-50" />

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 20px -10px rgb(0 0 0 / 0.25)',
          }}
        />
        <Legend verticalAlign="top" height={32} iconType="circle" />
        <Bar dataKey="masuk" name="Barang Masuk" fill="#6366F1" radius={[6, 6, 0, 0]} />
        <Bar dataKey="keluar" name="Barang Keluar" fill="#F97316" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const kpis = [
    { title: 'Total Barang', value: data.totalBarang, delta: 0, icon: Boxes, accent: 'bg-indigo-600' },
    { title: 'Jenis Barang', value: data.totalJenis, delta: 0, icon: Package, accent: 'bg-blue-600' },
    { title: 'Satuan', value: data.totalSatuan, delta: 0, icon: Ruler, accent: 'bg-slate-900' },
    { title: 'Barang Masuk (Bulan Ini)', value: data.masukBulanIni, delta: data.deltaMasukPct, icon: TrendingUp, accent: 'bg-emerald-600' },
    { title: 'Barang Keluar (Bulan Ini)', value: data.keluarBulanIni, delta: data.deltaKeluarPct, icon: TrendingDown, accent: 'bg-rose-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Ringkasan stok, transaksi, dan aktivitas terbaru</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/master/items"
            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Data Barang
          </Link>
          <Link
            href="/transactions/in"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Barang Masuk
          </Link>
          <Link
            href="/transactions/out"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
          >
            Barang Keluar
          </Link>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          const positive = kpi.delta >= 0
          const gradientId = `spark-${idx}`
          return (
            <div key={kpi.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 min-w-[260px] shrink-0 sm:min-w-0 sm:shrink">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{kpi.title}</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-3xl font-bold tracking-tight text-gray-900">{kpi.value}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {formatPct(kpi.delta)}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl p-3 text-white ${kpi.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-14">
                <Spark data={data.spark} gradientId={gradientId} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 xl:col-span-2 flex flex-col h-[320px] sm:h-[400px]">
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Grafik Transaksi</h3>
              <p className="text-xs text-gray-500">Barang masuk dan keluar (7 bulan terakhir)</p>
            </div>
          </div>
          <div className="mt-4 flex-1 w-full min-h-0">
            <TxChart data={data.chart} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 flex flex-col h-[320px] sm:h-[400px]">
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Persediaan Kritis</h3>
              <p className="text-xs text-gray-500">Barang yang perlu segera restock</p>
            </div>
            <Link href="/reports/stock" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Lihat
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto mt-4">
            <LowStockList items={data.lowStock} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h3>
            <p className="text-xs text-gray-500">Riwayat transaksi terbaru</p>
          </div>
          <Link href="/transactions/logs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Semua Log
          </Link>
        </div>
        <ActivityTable rows={data.activities} />
      </div>
    </div>
  )
}
