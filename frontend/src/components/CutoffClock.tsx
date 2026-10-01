import { useEffect, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'

export default function CutoffClock({ cutoff }: { cutoff: string }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
       <div className="card flex items-center gap-4 whitespace-nowrap px-4 py-2.5 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <CalendarDays size={16} className="text-[var(--brand)]" />
        {cutoff}
      </span>
      <span className="h-5 w-px bg-[var(--line)]" />
      <span className="flex items-center gap-2 tabular-nums">
        <Clock size={16} className="text-[var(--brand)]" />
        {time}
      </span>
    </div>
  )
}