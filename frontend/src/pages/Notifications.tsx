import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

type Item = {
  id: number
  title: string
  message: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export default function Notifications() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      setItems(await api<Item[]>('/notifications'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const open = async (n: Item) => {
    if (!n.read) {
      await api(`/notifications/${n.id}/read`, { method: 'POST' })
      load()
    }
    if (n.link) navigate(n.link)
  }

  const readAll = async () => {
    await api('/notifications/read-all', { method: 'POST' })
    load()
  }

  return (
    <div className="w-full">
      {items.some((n) => !n.read) && (
        <div className="mb-4 flex justify-end">
          <button className="btn-outline" onClick={readAll}>Mark all as read</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      ) : items.length === 0 ? (
        <p className="card p-8 text-center text-sm text-[var(--muted)]">No notifications.</p>
      ) : (
        <ul className="card divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => open(n)}
              className="flex cursor-pointer items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-[var(--brand)]'}`} />
              <div className="min-w-0 flex-1">
                <strong className="text-sm">{n.title}</strong>
                {n.message && <p className="mt-0.5 text-sm text-[var(--muted)]">{n.message}</p>}
              </div>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}