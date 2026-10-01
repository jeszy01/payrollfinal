import { useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { removeBenefit, saveBenefit, useBenefits } from '../lib/benefitStore'

export type Field = {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
  required?: boolean
  default?: string
  showIf?: (form: Record<string, string>) => boolean
}

type Props<T> = {
  resource: string
  title: string
  addLabel: string
  fields: Field[]
  columns: { label: string; render: (row: T) => ReactNode }[]
}

const input = 'rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]'
const bd = { borderColor: 'var(--line)' }
const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

export default function CrudPage<T extends { id: string }>({ resource, title, addLabel, fields, columns }: Props<T>) {
  const rows = useBenefits<T>(resource)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const show = (f: Field) => f.showIf?.(form) ?? true

  const openForm = (row?: T) => {
    const init: Record<string, string> = {}
    fields.forEach((f) => {
      const v = row ? (row as unknown as Record<string, unknown>)[f.key] : undefined
      init[f.key] = v == null ? (f.default ?? '') : String(v)
    })
    setForm(init)
    setEditId(row?.id ?? null)
    setError('')
    setOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body: Record<string, string | number | null> = {}
      fields.forEach((f) => {
        const v = form[f.key]
        body[f.key] = !show(f) || v === '' ? null : f.type === 'number' ? Number(v) : v
      })
      await saveBenefit(resource, editId, body)
      setOpen(false)
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this record?')) return
    try {
      await removeBenefit(resource, id)
    } catch (err) {
      alert(message(err))
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => openForm()} className="btn-primary">
          <Plus size={18} /> {addLabel}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <div className="tbl-head">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-[var(--muted)]">{rows.length} records</p>
          </div>
        </div>
        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.label}>{c.label}</th>)}
              <th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="!py-12 text-center text-[var(--muted)]">No records yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                <td>
                  <div className="flex justify-end gap-2">
                    <button aria-label="Edit" onClick={() => openForm(r)} className="btn-icon"><Pencil size={16} /></button>
                    <button aria-label="Delete" onClick={() => remove(r.id)} className="btn-icon hover:!text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4">
          <form onSubmit={submit} className="card w-full max-w-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editId ? 'Edit' : 'New'} record</h3>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              {fields.filter(show).map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--muted)]">{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'select' ? (
                    <select
                      required={f.required}
                      className={input}
                      style={bd}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      required={f.required}
                      type={f.type ?? 'text'}
                      min={f.type === 'number' ? 0 : undefined}
                      step={f.type === 'number' ? 'any' : undefined}
                      className={input}
                      style={bd}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
              <button disabled={saving} className="btn-primary !px-5 !py-2.5 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}