'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Pencil, Plus, Power, Trash2, Upload } from 'lucide-react'
import { clsx } from 'clsx'
import * as XLSX from 'xlsx'

type ItemRow = {
  id_barang: number
  kd_barang: string
  barcode: string
  nama_barang: string
  harga: string
  stok_minimum: number
  stok: number
  foto: string | null
  is_active: string
  nama_jenis: string | null
  nama_satuan: string | null
  id_jenis: number
  id_satuan: number
}

type CategoryOption = { id_jenis: number; nama_jenis: string; is_active: 'ONE' | 'ZERO' | 'EMPTY' }
type UnitOption = { id_satuan: number; nama_satuan: string; is_active: 'ONE' | 'ZERO' }

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-600 ring-gray-200'
      )}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function moneyId(v: string) {
  const n = Number(v)
  if (!Number.isFinite(n)) return v
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function parseIdNumber(input: string) {
  const cleaned = input.replace(/[^\d]/g, '')
  if (!cleaned) return NaN
  return Number(cleaned)
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Tutup
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function downloadExcel(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, filename)
}

export default function MasterItemsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<ItemRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ItemRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    kd_barang: '',
    barcode: '',
    nama_barang: '',
    harga: '',
    id_jenis: '',
    id_satuan: '',
    stok_minimum: '',
    foto: '',
  })

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const refresh = async () => {
    const url = new URL('/api/master/items', window.location.origin)
    url.searchParams.set('q', q)
    url.searchParams.set('status', status)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    const r = await fetch(url.toString(), { cache: 'no-store' })
    const data = await r.json()
    if (!r.ok) throw new Error(data?.error ?? 'Gagal memuat data')
    setRows(data.rows ?? [])
    setTotal(data.total ?? 0)
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const url = new URL('/api/master/items', window.location.origin)
    url.searchParams.set('q', q)
    url.searchParams.set('status', status)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))

    fetch(url.toString(), { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error ?? 'Gagal memuat data')
        setRows(data.rows ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [q, status, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [q, status, pageSize])

  useEffect(() => {
    const controller = new AbortController()

    const loadOptions = async () => {
      const [catRes, unitRes] = await Promise.all([
        fetch('/api/master/categories?page=1&pageSize=200&status=all', { signal: controller.signal, cache: 'no-store' }),
        fetch('/api/master/units?page=1&pageSize=200&status=all', { signal: controller.signal, cache: 'no-store' }),
      ])
      const cat = await catRes.json()
      const unit = await unitRes.json()
      if (catRes.ok) setCategories((cat.rows ?? []) as CategoryOption[])
      if (unitRes.ok) setUnits((unit.rows ?? []) as UnitOption[])
    }

    loadOptions().catch(() => {})
    return () => controller.abort()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({
      kd_barang: '',
      barcode: '',
      nama_barang: '',
      harga: '',
      id_jenis: '',
      id_satuan: '',
      stok_minimum: '',
      foto: '',
    })
    setModalOpen(true)
  }

  const openEdit = (row: ItemRow) => {
    setEditing(row)
    setForm({
      kd_barang: row.kd_barang,
      barcode: row.barcode,
      nama_barang: row.nama_barang,
      harga: String(row.harga ?? ''),
      id_jenis: String(row.id_jenis),
      id_satuan: String(row.id_satuan),
      stok_minimum: String(row.stok_minimum ?? 0),
      foto: row.foto ?? '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const hargaParsed = parseIdNumber(form.harga)
      const payload = {
        kd_barang: form.kd_barang.trim(),
        barcode: form.barcode.trim(),
        nama_barang: form.nama_barang.trim(),
        harga: hargaParsed,
        id_jenis: Number(form.id_jenis),
        id_satuan: Number(form.id_satuan),
        stok_minimum: Number(form.stok_minimum),
        foto: form.foto.trim() ? form.foto.trim() : null,
      }

      if (!payload.kd_barang || !payload.nama_barang) throw new Error('Kode barang dan nama barang wajib diisi')
      if (!Number.isFinite(payload.harga) || payload.harga < 0) throw new Error('Harga tidak valid')
      if (!Number.isFinite(payload.id_jenis) || !Number.isFinite(payload.id_satuan)) throw new Error('Jenis dan satuan wajib dipilih')
      if (!Number.isFinite(payload.stok_minimum) || payload.stok_minimum < 0) throw new Error('Stok minimum tidak valid')

      if (editing) {
        const r = await fetch(`/api/master/items/${editing.id_barang}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error ?? 'Gagal menyimpan')
      } else {
        const r = await fetch('/api/master/items', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...payload, is_active: 'ONE' }),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error ?? 'Gagal menyimpan')
      }

      setModalOpen(false)
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: ItemRow) => {
    const next = row.is_active === '1' || row.is_active === 'ONE' ? 'ZERO' : 'ONE'
    const r = await fetch(`/api/master/items/${row.id_barang}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setError(data?.error ?? 'Gagal update status')
      return
    }
    await refresh()
  }

  const removeRow = async (row: ItemRow) => {
    if (!confirm(`Hapus data barang "${row.nama_barang}"?`)) return
    const r = await fetch(`/api/master/items/${row.id_barang}`, { method: 'DELETE' })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      setError(data?.error ?? 'Gagal menghapus')
      return
    }
    await refresh()
  }

  const resolveFotoSrc = (v: string | null) => {
    if (!v) return null
    const s = String(v).trim()
    if (!s) return null
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    if (s.startsWith('/')) return s
    return `/uploads/${s}`
  }

  const openImport = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const normalizeHeader = (v: unknown) => String(v ?? '').trim().toUpperCase().replace(/\s+/g, ' ')

  const handleImportFile = async (file: File) => {
    setImporting(true)
    setError(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      if (!Array.isArray(json) || json.length === 0) throw new Error('File kosong / format tidak terbaca')

      const catMap = new Map(activeCategories.map((c) => [c.nama_jenis.trim().toLowerCase(), c.id_jenis]))
      const unitMap = new Map(activeUnits.map((u) => [u.nama_satuan.trim().toLowerCase(), u.id_satuan]))

      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const k of keys) {
          const found = Object.keys(row).find((rk) => normalizeHeader(rk) === k)
          if (found) return row[found]
        }
        return undefined
      }

      const items = json.map((r) => {
        const kd = String(pick(r, ['KD BARANG', 'KODE', 'KODE BARANG', 'KD_BARANG', 'KD_BARANG ']) ?? '').trim()
        const barcode = String(pick(r, ['BARCODE']) ?? '').trim()
        const nama = String(pick(r, ['NAMA BARANG', 'NAMA', 'NAMA_BARANG']) ?? '').trim()
        const satuanName = String(pick(r, ['SATUAN']) ?? '').trim()
        const jenisName = String(pick(r, ['JENIS']) ?? '').trim()
        const hargaRaw = pick(r, ['HARGA', 'PRICE'])
        const stokMinRaw = pick(r, ['STOKMINIMUM', 'STOK MINIMUM', 'STOK_MINIMUM', 'MIN']) ?? 0
        const foto = String(pick(r, ['FOTO', 'PHOTO', 'GAMBAR']) ?? '').trim()

        const id_jenis = catMap.get(jenisName.toLowerCase()) ?? NaN
        const id_satuan = unitMap.get(satuanName.toLowerCase()) ?? NaN
        const harga = typeof hargaRaw === 'number' ? hargaRaw : parseIdNumber(String(hargaRaw ?? ''))
        const stok_minimum = typeof stokMinRaw === 'number' ? stokMinRaw : Number(String(stokMinRaw).replace(/[^\d]/g, '') || '0')

        return {
          kd_barang: kd,
          barcode,
          nama_barang: nama,
          id_jenis,
          id_satuan,
          harga,
          stok_minimum,
          foto: foto ? foto : null,
          is_active: 'ONE' as const,
        }
      })

      const invalid = items.find(
        (it) =>
          !it.kd_barang ||
          !it.barcode ||
          !it.nama_barang ||
          !Number.isFinite(it.id_jenis) ||
          !Number.isFinite(it.id_satuan) ||
          !Number.isFinite(it.harga) ||
          it.harga < 0 ||
          !Number.isFinite(it.stok_minimum) ||
          it.stok_minimum < 0
      )
      if (invalid) {
        throw new Error('Format kolom tidak sesuai / ada data kosong (KD BARANG, BARCODE, NAMA BARANG, SATUAN, JENIS, HARGA, STOKMINIMUM)')
      }

      const r = await fetch('/api/master/items/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error ?? 'Gagal import')

      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const exportCsv = () => {
    if (rows.length === 0) return
    const exportData = rows.map((r) => ({
      Kode: r.kd_barang,
      Barcode: r.barcode,
      Nama: r.nama_barang,
      Jenis: r.nama_jenis,
      Satuan: r.nama_satuan,
      Harga: r.harga,
      Stok: r.stok,
      Status: r.is_active === '1' ? 'Aktif' : 'Nonaktif',
    }))
    downloadExcel('DataBarang.xlsx', exportData)
  }

  const activeCategories = useMemo(() => categories.filter((c) => c.is_active === 'ONE'), [categories])
  const activeUnits = useMemo(() => units.filter((u) => u.is_active === 'ONE'), [units])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Barang</h2>
          <p className="text-sm text-gray-500">Kelola master barang dan stok minimum</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Data
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Export Excel
          </button>
          <button
            onClick={openImport}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Import...' : 'Import Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportFile(f)
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  Show {n}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:w-80"
            />
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-sky-50 text-left text-[11px] font-bold text-slate-700">
                <th className="py-3 pr-4 pl-3">#</th>
                <th className="py-3 pr-4">KD BARANG</th>
                <th className="py-3 pr-4">BARCODE</th>
                <th className="py-3 pr-4">NAMA BARANG</th>
                <th className="py-3 pr-4">SATUAN</th>
                <th className="py-3 pr-4">JENIS</th>
                <th className="py-3 pr-4">HARGA</th>
                <th className="py-3 pr-4">STOKMINIMUM</th>
                <th className="py-3 pr-4">STOK</th>
                <th className="py-3 pr-4">FOTO</th>
                <th className="py-3 pr-4">STATUS</th>
                <th className="py-3">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={10}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={10}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const active = row.is_active === '1' || row.is_active === 'ONE'
                  const fotoSrc = resolveFotoSrc(row.foto)
                  return (
                    <tr key={row.id_barang} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 pl-3 text-center text-xs text-gray-500">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-700">{row.kd_barang}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-700">{row.barcode}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{row.nama_barang}</td>
                      <td className="py-3 pr-4">{row.nama_satuan ?? '-'}</td>
                      <td className="py-3 pr-4">{row.nama_jenis ?? '-'}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{moneyId(row.harga)}</td>
                      <td className="py-3 pr-4">{row.stok_minimum}</td>
                      <td className={clsx('py-3 pr-4', row.stok < 0 ? 'font-bold text-rose-600' : '')}>{row.stok}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-center">
                          {fotoSrc ? (
                            <Image
                              src={fotoSrc}
                              alt="foto"
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                              unoptimized
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 ring-1 ring-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge active={active} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-2.5 py-2 text-white hover:bg-amber-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeRow(row)}
                            className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-2.5 py-2 text-white hover:bg-pink-700"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(row)}
                            className={clsx(
                              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white',
                              active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'
                            )}
                            title="Aktif / Nonaktif"
                          >
                            <Power className="h-4 w-4" />
                            {active ? 'Nonaktif' : 'Aktif'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Data Barang' : 'Tambah Data Barang'} onClose={() => setModalOpen(false)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-700">Kode Barang</label>
            <input
              value={form.kd_barang}
              onChange={(e) => setForm((p) => ({ ...p, kd_barang: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              placeholder="P0001"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Barcode</label>
            <input
              value={form.barcode}
              onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              placeholder="8997..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Nama Barang</label>
            <input
              value={form.nama_barang}
              onChange={(e) => setForm((p) => ({ ...p, nama_barang: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Contoh: Klem 5 mm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Jenis</label>
            <select
              value={form.id_jenis}
              onChange={(e) => setForm((p) => ({ ...p, id_jenis: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Pilih jenis</option>
              {activeCategories.map((c) => (
                <option key={c.id_jenis} value={c.id_jenis}>
                  {c.nama_jenis}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Satuan</label>
            <select
              value={form.id_satuan}
              onChange={(e) => setForm((p) => ({ ...p, id_satuan: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Pilih satuan</option>
              {activeUnits.map((u) => (
                <option key={u.id_satuan} value={u.id_satuan}>
                  {u.nama_satuan}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Harga</label>
            <input
              value={form.harga}
              onChange={(e) => setForm((p) => ({ ...p, harga: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="1750"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Stok Minimum</label>
            <input
              value={form.stok_minimum}
              onChange={(e) => setForm((p) => ({ ...p, stok_minimum: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="10"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Foto (opsional)</label>
            <input
              value={form.foto}
              onChange={(e) => setForm((p) => ({ ...p, foto: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nama file / URL"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-indigo-700"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
