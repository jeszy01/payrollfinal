import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'

type Holiday = { id: number; date: string; name: string; type: 'regular' | 'special'; multiplier: number }
type Form = { id?: number; date: string; name: string; type: 'regular' | 'special'; multiplier: string }

const DEFAULT_MULT = { regular: '2', special: '1.3' }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const dot = { regular: 'bg-red-500', special: 'bg-amber-500' }
const field = 'rounded-lg border bg-transparent px-3 py-2 text-sm'

export default function Holidays() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate())
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [items, setItems] = useState<Holiday[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await api<Holiday[]>('/holidays'))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const byDate = new Map(items.map((h) => [h.date, h]))
  const first = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  const monthItems = items.filter((h) => h.date.startsWith(`${year}-${pad(month + 1)}`))

  const openDay = (d: number) => {
    const date = ymd(year, month, d)
    const h = byDate.get(date)
    setForm(
      h
        ? { id: h.id, date: h.date, name: h.name, type: h.type, multiplier: String(h.multiplier) }
        : { date, name: '', type: 'regular', multiplier: DEFAULT_MULT.regular }
    )
  }

  const edit = (h: Holiday) =>
    setForm({ id: h.id, date: h.date, name: h.name, type: h.type, multiplier: String(h.multiplier) })

  const save = async () => {
    if (!form) return
    setBusy(true)
    try {
      await api(form.id ? `/holidays/${form.id}` : '/holidays', {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, multiplier: Number(form.multiplier) }),
      })
      setForm(null)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this holiday?')) return
    setBusy(true)
    try {
      await api(`/holidays/${id}`, { method: 'DELETE' })
      setForm(null)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid w-full gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="hd-icon" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <strong className="text-base">
            {MONTHS[month]} {year}
          </strong>
          <button className="hd-icon" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
          {DAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const h = byDate.get(ymd(year, month, d))
            return (
             <button
  key={i}
  onClick={() => openDay(d)}
  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm hover:bg-slate-100 dark:hover:bg-white/10 ${
    ymd(year, month, d) === todayStr ? 'ring-2 ring-[var(--brand)]' : ''
  }`}
  style={{ borderColor: 'var(--line)' }}
>
                {d}
                {h && <span className={`size-1.5 rounded-full ${dot[h.type]}`} />}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${dot.regular}`} /> Regular</span>
          <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${dot.special}`} /> Special</span>
        </div>
      </div>

      <div className="space-y-5">
        {form && (
          <div className="card space-y-3 p-5">
            <input type="date" className={`${field} w-full`} style={{ borderColor: 'var(--line)' }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input className={`${field} w-full`} style={{ borderColor: 'var(--line)' }} placeholder="Holiday name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="flex gap-2">
              <select
                className={`${field} flex-1`}
                style={{ borderColor: 'var(--line)' }}
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as Form['type']
                  setForm({ ...form, type, multiplier: form.id ? form.multiplier : DEFAULT_MULT[type] })
                }}
              >
                <option value="regular">Regular</option>
                <option value="special">Special</option>
              </select>
              <input type="number" step="0.01" min="1" className={`${field} w-24`} style={{ borderColor: 'var(--line)' }} value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              {form.id && (
                <button className="btn-outline mr-auto text-red-600" disabled={busy} onClick={() => remove(form.id!)}>Delete</button>
              )}
              <button className="btn-outline" disabled={busy} onClick={() => setForm(null)}>Cancel</button>
              <button className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={save}>Save</button>
            </div>
          </div>
        )}

        <div className="card divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
          {monthItems.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--muted)]">No holidays this month.</p>
          ) : (
            monthItems.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-4" style={{ borderColor: 'var(--line)' }}>
                <span className={`size-2 shrink-0 rounded-full ${dot[h.type]}`} />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{h.name}</strong>
                  <span className="text-xs text-[var(--muted)]">{h.date} · {h.multiplier}x</span>
                </div>
                <button className="hd-icon" onClick={() => edit(h)} aria-label="Edit"><Pencil size={15} /></button>
                <button className="hd-icon" onClick={() => remove(h.id)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}