import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

type Ot = {
  id: string | number
  employeeName: string
  date: string
  otMinutes: number
  otReason: string | null
  otStatus: 'pending' | 'approved' | 'rejected'
  otRemarks: string | null
}

const tabs = ['pending', 'approved', 'rejected', 'all'] as const
const hm = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`
const badge = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function Overtime() {
  const [rows, setRows] = useState<Ot[]>([])
  const [tab, setTab] = useState<(typeof tabs)[number]>('pending')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
            setRows(await api<Ot[]>('/attendance/overtime?status=all'))
       } catch (e) {
      console.error('Overtime load failed:', e)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const act = async (path: string, body?: unknown) => {
    setBusy(true)
    try {
      await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const reject = (r: Ot) => {
    const remarks = window.prompt('Reason for rejection:')?.trim()
    if (remarks) act(`/attendance/overtime/${r.id}/reject`, { remarks })
  }

  const shown = tab === 'all' ? rows : rows.filter((r) => r.otStatus === tab)

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? 'bg-[var(--brand)] text-white' : 'btn-outline'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted)]">No overtime records.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">OT</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="p-4 font-semibold">{r.employeeName}</td>
                  <td className="p-4">{r.date}</td>
                  <td className="p-4">{hm(r.otMinutes)}</td>
                  <td className="p-4">{r.otReason}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[r.otStatus]}`}>
                      {r.otStatus}
                    </span>
                    {r.otRemarks && <p className="mt-1 text-xs text-[var(--muted)]">{r.otRemarks}</p>}
                  </td>
                  <td className="p-4">
                    {r.otStatus === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busy}
                          onClick={() => act(`/attendance/overtime/${r.id}/approve`)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => reject(r)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}