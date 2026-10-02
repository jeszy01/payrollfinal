import { useCallback, useEffect, useState } from 'react'
import { LogOut, Monitor, Smartphone, Trash2 } from 'lucide-react'
import { listDevices, removeDevice, removeOtherDevices, type Device } from '../lib/devices'

function ago(iso: string | null) {
  if (!iso) return 'Never'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return new Date(iso).toLocaleString()
}

const isMobile = (name: string) => /Android|iOS/.test(name)

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setDevices(await listDevices())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load devices.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const remove = (d: Device) => {
    if (!confirm(`Remove ${d.device}? It will be logged out.`)) return
    act(() => removeDevice(d.id))
  }

  const removeOthers = () => {
    if (!confirm('Log out all other devices?')) return
    act(removeOtherDevices)
  }

  const others = devices.filter((d) => !d.current).length

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Devices</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Devices currently signed in to your account. Remove any you don't recognize.
          </p>
        </div>
        {others > 0 && (
          <button
            onClick={removeOthers}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            style={{ borderColor: 'var(--line)' }}
          >
            <LogOut size={16} />
            Log out all other devices
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      ) : (
        <ul className="space-y-3">
          {devices.map((d) => {
            const Icon = isMobile(d.device) ? Smartphone : Monitor
            return (
              <li
                key={d.id}
                className="flex items-center gap-4 rounded-2xl border bg-[var(--card)] p-4"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e4eaff] text-[var(--brand)]">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-sm">{d.device}</strong>
                    {d.current && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {d.ip ?? 'Unknown IP'} · Last active {ago(d.lastUsedAt)}
                  </p>
                </div>
                {!d.current && (
                  <button
                    onClick={() => remove(d)}
                    disabled={busy}
                    aria-label={`Remove ${d.device}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}