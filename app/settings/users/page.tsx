'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Save, X } from 'lucide-react'

type User = {
  user_id: number
  firstname: string
  email: string
  level: 'admin' | 'operator'
  status: 'aktif' | 'nonaktif'
  nohape: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    firstname: '',
    email: '',
    password: '',
    level: 'operator',
    nohape: '',
    status: 'aktif',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  const handleEdit = (user: User) => {
    setEditing(user)
    setIsNew(false)
    setForm({
      firstname: user.firstname,
      email: user.email,
      password: '',
      level: user.level,
      nohape: user.nohape,
      status: user.status,
    })
  }

  const handleNew = () => {
    setEditing(null)
    setIsNew(true)
    setForm({
      firstname: '',
      email: '',
      password: '',
      level: 'operator',
      nohape: '',
      status: 'aktif',
    })
  }

  const handleSave = async () => {
    const url = isNew ? '/api/users' : `/api/users/${editing?.user_id}`
    const method = isNew ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setIsNew(false)
      setEditing(null)
      fetchUsers()
    } else {
      alert('Gagal menyimpan data')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus user ini?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          <Plus size={18} /> Tambah User
        </button>
      </div>

      {(isNew || editing) && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="mb-4 text-lg font-semibold">{isNew ? 'Tambah User Baru' : 'Edit User'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-lg border p-2"
              placeholder="Nama Lengkap"
              value={form.firstname}
              onChange={(e) => setForm({ ...form, firstname: e.target.value })}
            />
            <input
              className="rounded-lg border p-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="rounded-lg border p-2"
              placeholder="Password (kosongkan jika tidak ubah)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              className="rounded-lg border p-2"
              placeholder="No HP"
              value={form.nohape}
              onChange={(e) => setForm({ ...form, nohape: e.target.value })}
            />
            <select
              className="rounded-lg border p-2"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="rounded-lg border p-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <Save size={18} /> Simpan
            </button>
            <button
              onClick={() => {
                setIsNew(false)
                setEditing(null)
              }}
              className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              <X size={18} /> Batal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900">
            <tr>
              <th className="px-6 py-3 font-medium">Nama</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Level</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
            ) : users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{user.firstname}</td>
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3 capitalize">{user.level}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    user.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleEdit(user)} className="mr-2 text-blue-600 hover:text-blue-800">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(user.user_id)} className="text-red-600 hover:text-red-800">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
