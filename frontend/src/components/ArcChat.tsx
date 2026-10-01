import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

type Msg = { role: 'user' | 'model'; text: string }

export default function ArcChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy, open])

  async function send() {
    const message = input.trim()
    if (!message || busy) return
    const history = msgs.slice(-6)
    setMsgs([...msgs, { role: 'user', text: message }])
    setInput('')
    setBusy(true)
    try {
      const res = await api<{ answer: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      })
      setMsgs((m) => [...m, { role: 'model', text: res.answer }])
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: 'model', text: e instanceof Error ? e.message : 'Arc is unavailable right now.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <img src="/arc_logo.png" alt="Arc" className="h-8 w-8" />
            <span className="flex-1 font-semibold text-slate-800">Arc</span>
            <button onClick={() => setOpen(false)} className="text-xl leading-none text-slate-400 hover:text-slate-600">
              ×
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ' +
                    (m.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-800')
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">...</div>
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="flex gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              maxLength={500}
              placeholder="Ask Arc"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="ml-auto block h-14 w-14 overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition hover:scale-105"
      >
        <img src="/arc_logo.png" alt="Arc" className="h-full w-full" />
      </button>
    </div>
  )
}