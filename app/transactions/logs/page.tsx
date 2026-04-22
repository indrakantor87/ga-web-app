'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Row = {
  kind: 'IN' | 'OUT'
  tanggal: string
  transaksi_id: string
  kd_barang: string
  nama_barang: string
  jumlah: number | null
  teknisi: string | null
  keterangan: string | null
}

export default function Page() {
  const [q, setQ] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  useEffect(() => {
    const controller = new AbortController()
    const url = new URL('/api/transactions/logs', window.location.origin)
    url.searchParams.set('q', q)
    if (start) url.searchParams.set('start', start)
    if (end) url.searchParams.set('end', end)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))

    fetch(url.toString(), { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        const data: unknown = await r.json()
        if (!r.ok) {
          const err = (data as { error?: string })?.error
          throw new Error(err ?? 'Gagal memuat data')
        }
        type LogsResponse = { rows?: Row[]; total?: number }
        const obj = data as LogsResponse
        const mapped: Row[] = (obj.rows ?? []).map((x) => ({
          kind: x.kind,
          tanggal: new Date(x.tanggal).toISOString().slice(0, 10),
          transaksi_id: String(x.transaksi_id),
          kd_barang: String(x.kd_barang),
          nama_barang: String(x.nama_barang),
          jumlah: typeof x.jumlah === 'number' ? x.jumlah : Number(x.jumlah ?? 0),
          teknisi: x.teknisi ?? null,
          keterangan: x.keterangan ?? null,
        }))
        setRows(mapped)
        setTotal(obj.total ?? 0)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [q, start, end, page, pageSize])

  const onChangeQ = (val: string) => {
    setQ(val)
    setPage(1)
  }
  const onChangeStart = (val: string) => {
    setStart(val)
    setPage(1)
  }
  const onChangeEnd = (val: string) => {
    setEnd(val)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Log Aktivitas</h2>
        <p className="text-sm text-gray-500">Riwayat barang masuk dan keluar</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  Show {n}
                </option>
              ))}
            </select>
            <input value={start} onChange={(e) => onChangeStart(e.target.value)} type="date" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <input value={end} onChange={(e) => onChangeEnd(e.target.value)} type="date" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input value={q} onChange={(e) => onChangeQ(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:w-80" />
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[860px] w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="py-3 pr-4">Tanggal</th>
                <th className="py-3 pr-4">Jenis</th>
                <th className="py-3 pr-4">Kode</th>
                <th className="py-3 pr-4">Nama Barang</th>
                <th className="py-3 pr-4">Jumlah</th>
                <th className="py-3 pr-4">Teknisi</th>
                <th className="py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={7}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.transaksi_id}-${idx}`} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4">{r.tanggal}</td>
                    <td className="py-3 pr-4">
                      <span className={r.kind === 'IN' ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200' : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200'}>
                        {r.kind === 'IN' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{r.transaksi_id}</td>
                    <td className="py-3 pr-4">{r.kd_barang} · {r.nama_barang}</td>
                    <td className="py-3 pr-4">{r.jumlah ?? 0}</td>
                    <td className="py-3 pr-4">{r.teknisi ?? '-'}</td>
                    <td className="py-3">{r.keterangan ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
          <div>Page {page} / {totalPages} · Total {total}</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
              Previous
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
