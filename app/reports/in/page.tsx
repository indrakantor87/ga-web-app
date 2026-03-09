'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Row = {
  id: number
  transaksi_id: string
  tanggal: string
  kd_barang: string
  nama_barang: string
  nama_satuan: string | null
  nama_jenis: string | null
  jumlah: number | null
  keterangan: string
}

type ApiResponse = { total?: number; page?: number; pageSize?: number; rows?: Array<Omit<Row, 'tanggal'> & { tanggal: string | Date }>; error?: string }

function downloadFromUrl(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noreferrer'
  a.click()
}

function openPrintWindow(title: string, headers: string[], rows: Array<Array<string | number>>) {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return

  const tableHead = `<tr>${headers.map((h) => `<th style="border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:12px;background:#f9fafb;">${h}</th>`).join('')}</tr>`
  const tableBody = rows
    .map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #e5e7eb;padding:8px;font-size:12px;">${String(c)}</td>`).join('')}</tr>`)
    .join('')

  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 16px;">
        <h2 style="margin:0 0 8px 0;">${title}</h2>
        <div style="margin:0 0 12px 0; color:#6b7280; font-size:12px;">Dicetak: ${new Date().toLocaleString('id-ID')}</div>
        <table style="border-collapse:collapse; width:100%">${tableHead}${tableBody}</table>
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
    </html>
  `)
  w.document.close()
}

export default function Page() {
  const [q, setQ] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const buildExportUrl = () => {
    const url = new URL('/api/reports/in', window.location.origin)
    url.searchParams.set('q', q)
    if (start) url.searchParams.set('start', start)
    if (end) url.searchParams.set('end', end)
    url.searchParams.set('export', 'csv')
    return url.toString()
  }

  useEffect(() => {
    const controller = new AbortController()
    const url = new URL('/api/reports/in', window.location.origin)
    url.searchParams.set('q', q)
    if (start) url.searchParams.set('start', start)
    if (end) url.searchParams.set('end', end)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))

    fetch(url.toString(), { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        const data = (await r.json()) as ApiResponse
        if (!r.ok) throw new Error(data.error ?? 'Gagal memuat data')
        const mapped: Row[] = (data.rows ?? []).map((x) => ({
          id: x.id,
          transaksi_id: x.transaksi_id,
          tanggal: new Date(x.tanggal).toISOString().slice(0, 10),
          kd_barang: x.kd_barang,
          nama_barang: x.nama_barang,
          nama_satuan: x.nama_satuan ?? null,
          nama_jenis: x.nama_jenis ?? null,
          jumlah: x.jumlah ?? 0,
          keterangan: x.keterangan ?? '',
        }))
        setRows(mapped)
        setTotal(data.total ?? 0)
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
    setLoading(true)
    setError(null)
    setQ(val)
    setPage(1)
  }
  const onChangeStart = (val: string) => {
    setLoading(true)
    setError(null)
    setStart(val)
    setPage(1)
  }
  const onChangeEnd = (val: string) => {
    setLoading(true)
    setError(null)
    setEnd(val)
    setPage(1)
  }
  const onChangePageSize = (val: number) => {
    setLoading(true)
    setError(null)
    setPageSize(val)
    setPage(1)
  }

  const exportExcel = () => downloadFromUrl(buildExportUrl())
  const exportPdf = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'Barang', 'Satuan', 'Jenis', 'Jumlah Masuk', 'Keterangan']
    const dataRows = rows.map((r) => [
      r.transaksi_id,
      r.tanggal,
      `${r.kd_barang} · ${r.nama_barang}`,
      r.nama_satuan ?? '-',
      r.nama_jenis ?? '-',
      r.jumlah ?? 0,
      r.keterangan ?? '',
    ])
    openPrintWindow('Laporan Barang Masuk', headers, dataRows)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Barang Masuk</h2>
          <p className="text-sm text-gray-500">Riwayat barang masuk</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportPdf} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            PDF
          </button>
          <button onClick={exportExcel} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={pageSize} onChange={(e) => onChangePageSize(Number(e.target.value))}>
              {[10, 25, 50, 100, 200].map((n) => (
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
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="py-3 pr-4">ID Transaksi</th>
                <th className="py-3 pr-4">Tanggal</th>
                <th className="py-3 pr-4">Barang</th>
                <th className="py-3 pr-4">Satuan</th>
                <th className="py-3 pr-4">Keterangan</th>
                <th className="py-3 pr-4">Jenis</th>
                <th className="py-3">Jumlah Masuk</th>
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
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">{r.transaksi_id}</td>
                    <td className="py-3 pr-4">{r.tanggal}</td>
                    <td className="py-3 pr-4">{r.nama_barang}</td>
                    <td className="py-3 pr-4">{r.nama_satuan ?? '-'}</td>
                    <td className="py-3 pr-4">{r.keterangan}</td>
                    <td className="py-3 pr-4">{r.nama_jenis ?? '-'}</td>
                    <td className="py-3 font-semibold">{r.jumlah ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Page {page} / {totalPages} · Total {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                setLoading(true)
                setError(null)
                setPage((p) => Math.max(1, p - 1))
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                setLoading(true)
                setError(null)
                setPage((p) => Math.min(totalPages, p + 1))
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
