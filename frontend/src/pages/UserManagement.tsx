import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { currentUser, type Role } from '../lib/auth'
import { createUser, deleteUser, listUsers, updateUser, type AppUser } from '../lib/userStore'

const field =
  'w-full rounded-xl border bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]'

const roleLabel: Record<Role, string> = { admin: 'Admin', hr: 'HR Staff' }

type Form = { id?: number; name: string; email: string; role: Role; password: string }
const empty: Form = { name: '', email: '', role: 'hr', password: '' }

export default function UserManagement() {
  const me = currentUser()
  const [users, setUsers] = useState<AppUser[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => listUsers().then(setUsers).catch((e) => setError(e.message))
  useEffect(() => {
    if (me?.role === 'admin') load()
  }, [])

  if (me?.role !== 'admin') {
    return <p className="text-sm text-[var(--muted)]">Only administrators can manage users.</p>
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const { id, password, ...rest } = form
      if (id) await updateUser(id, password ? { ...rest, password } : rest)
      else await createUser({ ...rest, password })
      setForm(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (u: AppUser) => {
    if (!confirm(`Delete ${u.name}?`)) return
    try {
      await deleteUser(u.id)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete.')
    }
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button className="btn-primary" onClick={() => { setError(''); setForm(empty) }}>
          <Plus size={16} /> Add user
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-bold">{u.name}</td>
                <td>{u.email}</td>
                <td>{roleLabel[u.role] ?? u.role}</td>
                <td>{u.createdAt}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-icon"
                      aria-label="Edit"
                      onClick={() => { setError(''); setForm({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' }) }}
                    >
                      <Pencil size={15} />
                    </button>
                    {u.email !== me?.email && (
                      <button className="btn-icon" aria-label="Delete" onClick={() => remove(u)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
  <tr><td colSpan={5} className="text-center text-[var(--muted)]">No users yet.</td></tr>
)}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={save} className="card w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{form.id ? 'Edit user' : 'Add user'}</h2>
              <button type="button" className="btn-icon" aria-label="Close" onClick={() => setForm(null)}>
                <X size={16} />
              </button>
            </div>

            <label className="text-xs font-semibold text-[var(--muted)]">Name</label>
            <input required className={`${field} mb-4 mt-1`} style={{ borderColor: 'var(--line)' }}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label className="text-xs font-semibold text-[var(--muted)]">Email</label>
            <input required type="email" className={`${field} mb-4 mt-1`} style={{ borderColor: 'var(--line)' }}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

            <label className="text-xs font-semibold text-[var(--muted)]">Role</label>
            <select className={`${field} mb-4 mt-1`} style={{ borderColor: 'var(--line)' }}
              value={form.role} disabled={form.email === me?.email}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="hr">HR Staff</option>
              <option value="admin">Admin</option>
            </select>

            <label className="text-xs font-semibold text-[var(--muted)]">
              {form.id ? 'New password (optional)' : 'Password'}
            </label>
            <input type="password" minLength={8} required={!form.id} autoComplete="new-password"
              className={`${field} mb-4 mt-1`} style={{ borderColor: 'var(--line)' }}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

            {error && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <button disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}