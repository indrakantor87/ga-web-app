'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import { clsx } from 'clsx'

type CategoryRow = {
  id_jenis: number
  nama_jenis: string
  is_active: 'ONE' | 'ZERO' | 'EMPTY'
}

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
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
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

export default function MasterCategoriesPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [namaJenis, setNamaJenis] = useState('')
  const [saving, setSaving] = useState(false)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const url = new URL('/api/master/categories', window.location.origin)
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

  const openAdd = () => {
    setEditing(null)
    setNamaJenis('')
    setModalOpen(true)
  }

  const openEdit = (row: CategoryRow) => {
    setEditing(row)
    setNamaJenis(row.nama_jenis)
    setModalOpen(true)
  }

  const refresh = async () => {
    const url = new URL('/api/master/categories', window.location.origin)
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

  const save = async () => {
    setSaving(true)
    try {
      const payload = { nama_jenis: namaJenis.trim() }
      if (!payload.nama_jenis) throw new Error('Nama jenis wajib diisi')

      if (editing) {
        const r = await fetch(`/api/master/categories/${editing.id_jenis}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error ?? 'Gagal menyimpan')
      } else {
        const r = await fetch('/api/master/categories', {
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

  const toggleActive = async (row: CategoryRow) => {
    const next = row.is_active === 'ONE' ? 'ZERO' : 'ONE'
    const r = await fetch(`/api/master/categories/${row.id_jenis}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jenis Barang</h2>
          <p className="text-sm text-gray-500">Kelola master jenis barang</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Data
        </button>
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
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:w-72"
            />
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="py-3 pr-4">#</th>
                <th className="py-3 pr-4">Nama Jenis</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={4}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={4}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const active = row.is_active === 'ONE'
                  return (
                    <tr key={row.id_jenis} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-500">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{row.nama_jenis}</td>
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
                            onClick={() => toggleActive(row)}
                            className={clsx(
                              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white',
                              active ? 'bg-gray-900 hover:bg-black' : 'bg-emerald-600 hover:bg-emerald-700'
                            )}
                            title="Aktif / Nonaktif"
                          >
                            <Power className="h-4 w-4" />
                            {active ? 'Nonaktif' : 'Aktifkan'}
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

      <Modal open={modalOpen} title={editing ? 'Edit Jenis Barang' : 'Tambah Jenis Barang'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Nama Jenis</label>
            <input
              value={namaJenis}
              onChange={(e) => setNamaJenis(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Contoh: Peralatan Teknisi"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
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
        </div>
      </Modal>
    </div>
  )
}
