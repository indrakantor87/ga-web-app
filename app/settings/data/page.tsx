'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

type SettingsData = {
  id: number
  nama_aplikasi: string
  alamat: string
  keterangan: string
  logo: string
}

export default function Page() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({ nama_aplikasi: '', alamat: '', keterangan: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    return data?.logo ? data.logo : ''
  }, [logoFile, data?.logo])

  useEffect(() => {
    if (!logoFile) return
    return () => URL.revokeObjectURL(logoPreview)
  }, [logoFile, logoPreview])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetch('/api/settings', { signal: controller.signal, cache: 'no-store' })
      .then(async (r) => {
        const d = (await r.json()) as Partial<SettingsData> & { error?: string }
        if (!r.ok) throw new Error(d.error ?? 'Gagal memuat settings')
        const normalized: SettingsData = {
          id: Number(d.id ?? 0),
          nama_aplikasi: String(d.nama_aplikasi ?? ''),
          alamat: String(d.alamat ?? ''),
          keterangan: String(d.keterangan ?? ''),
          logo: String(d.logo ?? ''),
        }
        setData(normalized)
        setForm({ nama_aplikasi: normalized.nama_aplikasi, alamat: normalized.alamat, keterangan: normalized.keterangan })
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const submit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const fd = new FormData()
      fd.set('nama_aplikasi', form.nama_aplikasi)
      fd.set('alamat', form.alamat)
      fd.set('keterangan', form.keterangan)
      if (logoFile) fd.set('logo', logoFile)

      const r = await fetch('/api/settings', { method: 'POST', body: fd })
      const res = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) throw new Error(res.error ?? 'Gagal update settings')

      const r2 = await fetch('/api/settings', { cache: 'no-store' })
      const d2 = (await r2.json()) as SettingsData
      setData(d2)
      setLogoFile(null)
      setSuccess('Pengaturan berhasil diperbarui')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Aplikasi</h2>
        <p className="text-sm text-gray-500">Update data aplikasi dan logo</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <div className="text-sm font-bold text-gray-900">UPDATE PENGATURAN</div>

            {error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</div>}
            {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">{success}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              <label className="text-sm font-semibold text-gray-700 md:pt-2">Nama Aplikasi</label>
              <div className="md:col-span-2">
                <input
                  value={form.nama_aplikasi}
                  onChange={(e) => setForm((p) => ({ ...p, nama_aplikasi: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Persediaan Barang Perkasa Networks"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              <label className="text-sm font-semibold text-gray-700 md:pt-2">Alamat</label>
              <div className="md:col-span-2">
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
                  className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              <label className="text-sm font-semibold text-gray-700 md:pt-2">Keterangan</label>
              <div className="md:col-span-2">
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
                  className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              <label className="text-sm font-semibold text-gray-700 md:pt-2">Logo</label>
              <div className="md:col-span-2 space-y-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
                {logoPreview ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <Image src={logoPreview} alt="Logo" width={240} height={80} className="h-20 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">Belum ada logo.</div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={saving}
                onClick={submit}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-indigo-700"
              >
                {saving ? 'Menyimpan...' : 'Update'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
