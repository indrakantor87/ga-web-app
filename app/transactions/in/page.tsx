'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash } from 'lucide-react'

type Row = {
  id: number
  transaksi_id: string
  tanggal: string
  kd_barang: string
  nama_barang: string
  nama_satuan: string | null
  jumlah: number | null
  keterangan: string
}

type ItemOption = { id_barang: number; kd_barang: string; nama_barang: string; nama_satuan: string | null }
type InListResponse = { rows?: Row[]; total?: number }
type ItemsResponse = {
  rows?: Array<{ id_barang: number; kd_barang: string; nama_barang: string; nama_satuan: string | null }>
}

function fmtDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Page() {
  const today = useMemo(() => new Date(), [])
  const [q, setQ] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<ItemOption[]>([])
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id_barang: '', tanggal: fmtDateInput(today), jumlah: '', keterangan: '' })
  const [editing, setEditing] = useState<Row | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const refresh = async () => {
    const url = new URL('/api/transactions/in', window.location.origin)
    url.searchParams.set('q', q)
    if (start) url.searchParams.set('start', start)
    if (end) url.searchParams.set('end', end)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    const r = await fetch(url.toString(), { cache: 'no-store' })
    const data: unknown = await r.json()
    if (!r.ok) {
      const err = (data as { error?: string })?.error
      throw new Error(err ?? 'Gagal memuat data')
    }
    const obj = data as InListResponse
    const mapped: Row[] = (obj.rows ?? []).map((x) => ({
      id: x.id,
      transaksi_id: String(x.transaksi_id),
      tanggal: new Date(x.tanggal).toISOString().slice(0, 10),
      kd_barang: String(x.kd_barang),
      nama_barang: String(x.nama_barang),
      nama_satuan: x.nama_satuan ?? null,
      jumlah: typeof x.jumlah === 'number' ? x.jumlah : Number(x.jumlah ?? 0),
      keterangan: String(x.keterangan ?? ''),
    }))
    setRows(mapped)
    setTotal(obj.total ?? 0)
  }

  useEffect(() => {
    const controller = new AbortController()
    const nextLoading = true
    if (nextLoading) {}
    const url = new URL('/api/transactions/in', window.location.origin)
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
        const obj = data as InListResponse
        const mapped: Row[] = (obj.rows ?? []).map((x) => ({
          id: x.id,
          transaksi_id: String(x.transaksi_id),
          tanggal: new Date(x.tanggal).toISOString().slice(0, 10),
          kd_barang: String(x.kd_barang),
          nama_barang: String(x.nama_barang),
          nama_satuan: x.nama_satuan ?? null,
          jumlah: typeof x.jumlah === 'number' ? x.jumlah : Number(x.jumlah ?? 0),
          keterangan: String(x.keterangan ?? ''),
        }))
        setRows(mapped)
        setTotal(obj.total ?? 0)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
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

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/master/items?page=1&pageSize=500&status=active', { signal: controller.signal })
      .then((r) => r.json())
      .then((d: ItemsResponse) => {
        const opts: ItemOption[] = (d.rows ?? []).map((it) => ({
          id_barang: it.id_barang,
          kd_barang: it.kd_barang,
          nama_barang: it.nama_barang,
          nama_satuan: it.nama_satuan ?? null,
        }))
        setItems(opts)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        id_barang: Number(form.id_barang),
        tanggal: form.tanggal,
        jumlah: Number(form.jumlah),
        keterangan: form.keterangan.trim(),
      }
      if (!Number.isFinite(payload.id_barang)) throw new Error('Pilih barang')
      if (!Number.isFinite(payload.jumlah) || payload.jumlah <= 0) throw new Error('Jumlah tidak valid')
      const url = editing ? `/api/transactions/in/${editing.id}` : '/api/transactions/in'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error ?? 'Gagal menyimpan')
      setModal(false)
      setEditing(null)
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (row: Row) => {
    setEditing(row)
    setForm({
      id_barang: String(items.find((it) => it.kd_barang === row.kd_barang)?.id_barang ?? ''),
      tanggal: row.tanggal,
      jumlah: String(row.jumlah ?? ''),
      keterangan: row.keterangan ?? '',
    })
    setModal(true)
  }

  const onDelete = async (row: Row) => {
    if (!confirm(`Hapus transaksi ${row.transaksi_id}? Stok akan disesuaikan.`)) return
    const r = await fetch(`/api/transactions/in/${row.id}`, { method: 'DELETE' })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setError(data?.error ?? 'Gagal menghapus')
      return
    }
    await refresh()
  }

  const exportExcel = () => {
    const url = new URL('/api/transactions/in', window.location.origin)
    url.searchParams.set('q', q)
    if (start) url.searchParams.set('start', start)
    if (end) url.searchParams.set('end', end)
    url.searchParams.set('export', 'csv')
    const a = document.createElement('a')
    a.href = url.toString()
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barang Masuk</h2>
          <p className="text-sm text-gray-500">Data barang masuk</p>
        </div>
        <div className="flex items-center gap-2">
        <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Tambah Data
        </button>
        <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          Export Excel
        </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  Show {n}
                </option>
              ))}
            </select>
            <input value={start} onChange={(e) => onChangeStart(e.target.value)} type="date" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <input value={end} onChange={(e) => onChangeEnd(e.target.value)} type="date" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input value={q} onChange={(e) => onChangeQ(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:w-72" />
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="py-3 pr-4">ID Transaksi</th>
                <th className="py-3 pr-4">Tanggal</th>
                <th className="py-3 pr-4">Kode</th>
                <th className="py-3 pr-4">Nama Barang</th>
                <th className="py-3 pr-4">Satuan</th>
                <th className="py-3 pr-4">Jumlah</th>
                <th className="py-3 pr-4">Keterangan</th>
                <th className="py-3">Aksi</th>
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
                    <td className="py-3 pr-4 font-mono text-xs">{r.kd_barang}</td>
                    <td className="py-3 pr-4">{r.nama_barang}</td>
                    <td className="py-3 pr-4">{r.nama_satuan ?? '-'}</td>
                    <td className="py-3 pr-4">{r.jumlah ?? 0}</td>
                    <td className="py-3 pr-4">{r.keterangan}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(r)} className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-2.5 py-2 text-white hover:bg-amber-600" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(r)} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-2.5 py-2 text-white hover:bg-rose-700" title="Hapus">
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
              Previous
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Barang Masuk' : 'Tambah Barang Masuk'}</h3>
              <button onClick={() => setModal(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Tutup
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Barang</label>
                <select value={form.id_barang} onChange={(e) => setForm((p) => ({ ...p, id_barang: e.target.value }))} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  <option value="">Pilih barang</option>
                  {items.map((it) => (
                    <option key={it.id_barang} value={it.id_barang}>
                      {it.kd_barang} · {it.nama_barang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Tanggal</label>
                <input value={form.tanggal} onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))} type="date" className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Jumlah</label>
                <input value={form.jumlah} onChange={(e) => setForm((p) => ({ ...p, jumlah: e.target.value }))} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Keterangan</label>
                <input value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setModal(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-indigo-700">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
